import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

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
        user_role: 'admin',
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
        organizationType: user.organization?.organization_type ?? null,
      },
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.user_is_active) {
      throw new ForbiddenException({
        statusCode: 403,
        message:
          'Your account has been deactivated. Please contact your administrator.',
        reason: 'ACCOUNT_INACTIVE',
      });
    }

    const valid = await bcrypt.compare(password, user.user_password_hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user
      .update({
        where: { user_id: user.user_id },
        data: { user_last_login_at: new Date() },
      })
      .catch(() => {});

    const tokens = await this.createTokenPair(user.user_id);

    return {
      user: {
        id: user.user_id,
        email: user.user_email,
        name: `${user.user_first_name} ${user.user_last_name}`,
        role: user.user_role,
        organizationId: user.organization_id,
        organizationName: user.organization?.organization_name,
        organizationType: user.organization?.organization_type ?? null,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshTokenCookie: string) {
    const [familyId, rawToken] = refreshTokenCookie.split(':');
    if (!familyId || !rawToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenData = await this.redisService.getJson<{
      userId: string;
      familyId: string;
    }>(`rt:${rawToken}`);

    if (tokenData) {
      return this.rotateToken(rawToken, tokenData.userId, tokenData.familyId);
    }

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

  async logout(refreshTokenCookie: string): Promise<string | null> {
    const [, rawToken] = refreshTokenCookie.split(':');
    if (!rawToken) return null;

    const tokenData = await this.redisService.getJson<{
      userId: string;
      familyId: string;
    }>(`rt:${rawToken}`);
    if (tokenData) {
      await this.redisService.del(
        `rt:${rawToken}`,
        `rt_family:${tokenData.familyId}`,
      );
      await this.redisService.srem(
        `user_sessions:${tokenData.userId}`,
        tokenData.familyId,
      );
      await this.publishSessionRevoked(tokenData.userId, tokenData.familyId);
      return tokenData.userId;
    }
    return null;
  }

  async acceptInvitation(dto: AcceptInvitationDto) {
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

    if (invitation.invited_email.toLowerCase() !== dto.email.toLowerCase()) {
      throw new BadRequestException('Email does not match the invitation');
    }

    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

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
        organizationType: user.organization?.organization_type ?? null,
      },
      ...tokens,
    };
  }

  async getInvitation(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: { organization_name: true },
        },
      },
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

    return {
      email: invitation.invited_email,
      role: invitation.invited_role,
      organizationName: invitation.organization?.organization_name,
    };
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.user_is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return {
      id: user.user_id,
      email: user.user_email,
      name: `${user.user_first_name} ${user.user_last_name}`,
      role: user.user_role,
      organizationId: user.organization_id,
      organizationName: user.organization?.organization_name,
      organizationType: user.organization?.organization_type ?? null,
    };
  }

  async getSessions(userId: string, page: number = 1, limit: number = 10) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const familyIds = await this.redisService.smembers(
      `user_sessions:${userId}`,
    );

    const sessions: any[] = [];
    for (const familyId of familyIds) {
      const data = await this.redisService.getJson<{
        userId: string;
        latestToken: string;
      }>(`rt_family:${familyId}`);

      if (data && data.userId === userId) {
        sessions.push({
          sessionId: familyId,
          userId: data.userId,
          createdAt: new Date(),
          isCurrent: false,
        });
      } else {
        await this.redisService.srem(`user_sessions:${userId}`, familyId);
      }
    }

    const totalItems = sessions.length;
    const skip = (page - 1) * limit;
    const paginatedSessions = sessions.slice(skip, skip + limit);

    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data: paginatedSessions,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  async revokeSession(userId: string, sessionId: string) {
    const familyKey = `rt_family:${sessionId}`;
    const familyData = await this.redisService.getJson<{
      userId: string;
      latestToken: string;
    }>(familyKey);

    if (!familyData || familyData.userId !== userId) {
      throw new NotFoundException('Session not found');
    }

    await this.redisService.del(familyKey, `rt:${familyData.latestToken}`);
    await this.redisService.srem(`user_sessions:${userId}`, sessionId);

    await this.publishSessionRevoked(userId, sessionId);

    return { message: 'Session revoked successfully' };
  }

  async revokeAllSessions(
    userId: string,
    currentSessionId: string | null = null,
  ) {
    const familyIds = await this.redisService.smembers(
      `user_sessions:${userId}`,
    );

    let revokedCount = 0;
    for (const familyId of familyIds) {
      if (currentSessionId && familyId === currentSessionId) {
        continue;
      }

      const data = await this.redisService.getJson<{
        userId: string;
        latestToken: string;
      }>(`rt_family:${familyId}`);

      if (data && data.userId === userId) {
        await this.redisService.del(
          `rt_family:${familyId}`,
          `rt:${data.latestToken}`,
        );
        await this.redisService.srem(`user_sessions:${userId}`, familyId);
        await this.publishSessionRevoked(userId, familyId);
        revokedCount++;
      } else {
        await this.redisService.srem(`user_sessions:${userId}`, familyId);
      }
    }

    if (!currentSessionId) {
      await this.usersService.incrementTokenVersion(userId);
    }

    return {
      message: `Revoked ${revokedCount} session${revokedCount !== 1 ? 's' : ''}`,
    };
  }

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
    await this.redisService.sadd(`user_sessions:${userId}`, familyId);

    const user = await this.usersService.findById(userId);
    const accessToken = this.jwtService.sign({
      sub: user!.user_id,
      email: user!.user_email,
      role: user!.user_role,
      organizationId: user!.organization_id,
      tokenVersion: user!.user_token_version,
      sessionId: familyId,
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

    const markerTtl = 7 * 24 * 60 * 60;
    await this.redisService.del(`rt:${oldToken}`);
    await this.redisService.set(`rt_consumed:${oldToken}`, familyId, markerTtl);

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
      organizationId: user.organization_id,
      tokenVersion: user.user_token_version,
      sessionId: familyId,
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
      await this.redisService.srem(
        `user_sessions:${familyData.userId}`,
        familyId,
      );
      await this.publishSessionRevoked(familyData.userId, familyId);
    }
  }

  private async publishSessionRevoked(userId: string, sessionId: string) {
    try {
      await this.amqpConnection.publish('escv.events', 'auth.session_revoked', {
        userId,
        sessionId,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to publish session revocation for user ${userId}: ${(error as Error).message}`,
      );
    }
  }
}
