import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';

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
  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    // Check if organization email is already taken
    const existingOrg = await this.prisma.organization.findUnique({
      where: { organization_email: dto.organizationEmail },
    });
    if (existingOrg)
      throw new ConflictException('Organization email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        user_email: dto.email,
        user_password_hash: passwordHash,
        user_first_name: dto.firstName,
        user_last_name: dto.lastName,
        user_role: 'admin', // The creator of an organization is always the admin
        user_phone: dto.phone,
        organization: {
          create: {
            organization_name: dto.organizationName,
            organization_type: dto.organizationType,
            organization_email: dto.organizationEmail,
            organization_country: dto.organizationCountry ?? 'Egypt',
          },
        },
      },
      include: { organization: true },
    });

    const tokens = await this.createTokenPair(user.user_id);

    return {
      user: {
        id: user.user_id,
        email: user.user_email,
        name: `${user.user_first_name} ${user.user_last_name}`,
        role: user.user_role,
        organizationId: user.organization_id,
        organizationName: user.organization?.organization_name,
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

    const tokens = await this.createTokenPair(user.user_id);

    return {
      user: {
        id: user.user_id,
        email: user.user_email,
        name: `${user.user_first_name} ${user.user_last_name}`,
        role: user.user_role,
        organizationId: user.organization_id,
        organizationName: user.organization?.organization_name,
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

  async acceptInvitation(dto: AcceptInvitationDto) {
    // 1. Find invitation
    const invitation = await this.prisma.invitation.findUnique({
      where: { token: dto.token },
    });

    if (!invitation || invitation.status !== 'pending') {
      throw new BadRequestException('Invalid or expired invitation');
    }

    if (invitation.expires_at < new Date()) {
      await this.prisma.invitation.update({
        where: { invitation_id: invitation.invitation_id },
        data: { status: 'expired' },
      });
      throw new BadRequestException('Invitation has expired');
    }

    // 2. Email match test
    if (invitation.invited_email.toLowerCase() !== dto.email.toLowerCase()) {
      throw new BadRequestException('Email does not match the invitation');
    }

    // 3. Check duplicate
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // 4 & 5. Create user and mark invitation accepted in a single transaction
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const [user] = await this.prisma.$transaction([
      this.prisma.user.create({
        data: {
          user_email: dto.email,
          user_password_hash: passwordHash,
          user_first_name: dto.firstName,
          user_last_name: dto.lastName,
          user_role: invitation.invited_role,
          organization_id: invitation.organization_id,
        },
        include: { organization: true },
      }),
      this.prisma.invitation.update({
        where: { invitation_id: invitation.invitation_id },
        data: { status: 'accepted' },
      }),
    ]);

    const tokens = await this.createTokenPair(user.user_id);

    return {
      user: {
        id: user.user_id,
        email: user.user_email,
        name: `${user.user_first_name} ${user.user_last_name}`,
        role: user.user_role,
        organizationId: user.organization_id,
        organizationName: user.organization?.organization_name,
      },
      ...tokens,
    };
  }

  // ---------- Private helpers ----------

  private async createTokenPair(userId: string) {
    const familyId = randomUUID();
    const refreshToken = randomUUID();
    const ttlSeconds = 7 * 24 * 60 * 60;

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
