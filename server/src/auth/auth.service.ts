import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  // ---------- Registration ----------
  async register(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: string;
    phone?: string;
  }) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const org = await this.prisma.organization.findUnique({
      where: { organization_id: dto.organizationId },
      select: { organization_is_active: true },
    });
    if (!org || !org.organization_is_active) {
      throw new UnauthorizedException('Invalid or inactive organization');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        user_email: dto.email,
        user_password_hash: passwordHash,
        user_first_name: dto.firstName,
        user_last_name: dto.lastName,
        user_role: dto.role,
        organization_id: dto.organizationId,
        user_phone: dto.phone,
      },
    });

    const tokens = await this.createTokenPair(user.user_id, user.user_role);

    return {
      user: {
        id: user.user_id,
        email: user.user_email,
        name: `${user.user_first_name} ${user.user_last_name}`,
        role: user.user_role,
      },
      ...tokens,
    };
  }

  // ---------- Login ----------
  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.user_is_active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.user_password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.createTokenPair(user.user_id, user.user_role);

    return {
      user: {
        id: user.user_id,
        email: user.user_email,
        name: `${user.user_first_name} ${user.user_last_name}`,
        role: user.user_role,
      },
      ...tokens,
    };
  }

  // ---------- Refresh ----------
  async refreshToken(refreshTokenCookie: string) {
    const [familyId, rawToken] = refreshTokenCookie.split(':');
    if (!familyId || !rawToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is still valid in Redis
    const tokenData = await this.redisService.getJson<{
      userId: string;
      familyId: string;
    }>(`rt:${rawToken}`);

    if (tokenData) {
      // Normal rotation
      return this.rotateToken(rawToken, tokenData.userId, tokenData.familyId);
    }

    // Check consumed marker for replay detection
    const consumedFamily = await this.redisService.get(
      `rt_consumed:${rawToken}`,
    );
    if (consumedFamily) {
      this.logger.warn(
        `Refresh token reuse detected for family ${consumedFamily}`,
      );
      await this.handleReuse(consumedFamily);
      throw new UnauthorizedException(
        'Token reuse detected. All sessions revoked.',
      );
    }

    throw new UnauthorizedException('Refresh token expired');
  }

  // ---------- Logout ----------
  async logout(refreshTokenCookie: string) {
    const [, rawToken] = refreshTokenCookie.split(':');
    if (!rawToken) return;

    const tokenData = await this.redisService.getJson<{ familyId: string }>(
      `rt:${rawToken}`,
    );
    if (tokenData) {
      // Remove the token and its family
      await this.redisService.del(
        `rt:${rawToken}`,
        `rt_family:${tokenData.familyId}`,
      );
    }
  }

  // ---------- Private helpers ----------

  private async createTokenPair(userId: string, role: string) {
    const familyId = randomUUID();
    const refreshToken = randomUUID();
    const ttlSeconds = 7 * 24 * 60 * 60; // 7 days

    // Store token in Redis
    await this.redisService.setJson(
      `rt:${refreshToken}`,
      { userId, familyId },
      ttlSeconds,
    );

    await this.redisService.setJson(
      `rt_family:${familyId}`,
      { userId, latestToken: refreshToken },
      ttlSeconds,
    );

    const user = await this.usersService.findById(userId);
    const accessToken = this.jwtService.sign({
      sub: user!.user_id,
      email: user!.user_email,
      role: user!.user_role,
      tokenVersion: user!.user_token_version,
    });

    return {
      accessToken,
      refreshToken: `${familyId}:${refreshToken}`,
    };
  }

  private async rotateToken(
    oldToken: string,
    userId: string,
    familyId: string,
  ) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.user_is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Mark old token as consumed (replay detection)
    const markerTtl = 7 * 24 * 60 * 60; // 7 days
    await this.redisService.del(`rt:${oldToken}`);
    await this.redisService.set(`rt_consumed:${oldToken}`, familyId, markerTtl);

    // Generate new refresh token in same family
    const newRefreshToken = randomUUID();
    const ttlSeconds = 7 * 24 * 60 * 60;
    await this.redisService.setJson(
      `rt:${newRefreshToken}`,
      { userId, familyId },
      ttlSeconds,
    );

    await this.redisService.setJson(
      `rt_family:${familyId}`,
      { userId, latestToken: newRefreshToken },
      ttlSeconds,
    );

    const accessToken = this.jwtService.sign({
      sub: user.user_id,
      email: user.user_email,
      role: user.user_role,
      tokenVersion: user.user_token_version,
    });

    return {
      accessToken,
      refreshToken: `${familyId}:${newRefreshToken}`,
    };
  }

  private async handleReuse(familyId: string) {
    const familyData = await this.redisService.getJson<{
      userId: string;
      latestToken: string;
    }>(`rt_family:${familyId}`);
    if (familyData) {
      await this.redisService.del(
        `rt:${familyData.latestToken}`,
        `rt_family:${familyId}`,
      );
      await this.usersService.incrementTokenVersion(familyData.userId);
    }
  }
}
