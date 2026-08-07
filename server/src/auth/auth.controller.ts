import {
  Controller,
  Post,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
  ForbiddenException,
  Get,
  Query,
  BadRequestException,
  DefaultValuePipe,
  ParseIntPipe,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { UpdateProfileDto, UpdatePasswordDto } from './dto/update-profile.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new organization and user' })
  @ApiResponse({ status: 201, description: 'Successfully registered.' })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.authService.register(dto);

    this.setRefreshCookie(reply, result.refreshToken);
    this.auditService.log(
      {
        userId: result.user.id,
        organizationId: result.user.organizationId,
        action: 'AUTH_REGISTER',
        resourceType: 'user',
        resourceId: result.user.id,
        newValue: { email: result.user.email, role: result.user.role },
      },
      request,
    );
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login to an existing account' })
  @ApiResponse({ status: 200, description: 'Successfully logged in.' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    let result;
    try {
      result = await this.authService.login(dto.email, dto.password);
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        this.auditService.log(
          {
            userId: null,
            action: 'AUTH_LOGIN_FAILED',
            resourceType: 'user',
            newValue: { email: dto.email },
          },
          request,
        );
      }
      throw error;
    }

    this.setRefreshCookie(reply, result.refreshToken);
    this.auditService.log(
      {
        userId: result.user.id,
        organizationId: result.user.organizationId,
        action: 'AUTH_LOGIN',
        resourceType: 'user',
        resourceId: result.user.id,
        newValue: { email: result.user.email, role: result.user.role },
      },
      request,
    );
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  @ApiResponse({ status: 200, description: 'Returns the user profile.' })
  async getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile (name, phone)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateProfileDto,
    @Req() request: FastifyRequest,
  ) {
    const result = await this.authService.updateProfile(user.sub, dto);
    this.auditService.log(
      {
        userId: user.sub,
        action: 'AUTH_PROFILE_UPDATE',
        resourceType: 'user',
        resourceId: user.sub,
        newValue: dto as any,
      },
      request,
    );
    return result;
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully.' })
  async updatePassword(
    @CurrentUser() user: any,
    @Body() dto: UpdatePasswordDto,
    @Req() request: FastifyRequest,
  ) {
    const result = await this.authService.updatePassword(user.sub, dto);
    this.auditService.log(
      {
        userId: user.sub,
        action: 'AUTH_PASSWORD_CHANGE',
        resourceType: 'user',
        resourceId: user.sub,
      },
      request,
    );
    return result;
  }

  @Public()
  @Get('invitation')
  @ApiOperation({ summary: 'Get invitation details by token (public)' })
  @ApiResponse({ status: 200, description: 'Invitation details.' })
  async getInvitation(@Query('token') token: string) {
    if (!token) throw new BadRequestException('Token is required');
    return this.authService.getInvitation(token);
  }

  @Public()
  @Post('accept-invitation')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Accept an invitation and create account' })
  async acceptInvitation(
    @Body() dto: AcceptInvitationDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.authService.acceptInvitation(dto);
    this.setRefreshCookie(reply, result.refreshToken);
    this.auditService.log(
      {
        userId: result.user.id,
        organizationId: result.user.organizationId,
        action: 'AUTH_ACCEPT_INVITATION',
        resourceType: 'user',
        resourceId: result.user.id,
        newValue: { email: result.user.email, role: result.user.role },
      },
      request,
    );
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Refresh access token' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    let cookie = request.cookies['refresh_token'];
    if (!cookie) throw new UnauthorizedException('No refresh token');

    const unsignResult = request.unsignCookie(cookie);
    if (!unsignResult.valid || !unsignResult.value) {
      throw new UnauthorizedException('Invalid or tampered cookie signature');
    }
    cookie = unsignResult.value;
    const result = await this.authService.refreshToken(cookie);

    this.setRefreshCookie(reply, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  @Public()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    let logoutUserId: string | null = null;
    let cookie = request.cookies['refresh_token'];
    if (cookie) {
      const result = request.unsignCookie(cookie);
      if (result.valid && result.value) {
        logoutUserId = await this.authService.logout(result.value);
      }
    }
    reply.clearCookie('refresh_token', { path: '/api/auth' });
    this.auditService.log(
      {
        userId: logoutUserId,
        action: 'AUTH_LOGOUT',
        resourceType: 'user',
        resourceId: logoutUserId,
      },
      request,
    );
    return;
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List all active sessions for current user' })
  @ApiResponse({ status: 200, description: 'List of active sessions returned' })
  async getSessions(
    @CurrentUser() user: any,
    @Query() query: PaginationDto,
    @Req() request: FastifyRequest,
  ) {
    const currentSessionId = this.resolveCurrentSessionId(user, request);

    return this.authService.getSessions(
      user.sub,
      query.page,
      query.limit,
      currentSessionId,
    );
  }

  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiResponse({ status: 200, description: 'Session revoked successfully.' })
  async revokeSession(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string,
    @Req() request: FastifyRequest,
  ) {
    const result = await this.authService.revokeSession(user.sub, sessionId);

    this.auditService.log(
      {
        action: 'AUTH_SESSION_REVOKE',
        resourceType: 'session',
        resourceId: sessionId,
        userId: user.sub,
        newValue: { revoked: true },
      },
      request,
    );

    return result;
  }

  @Delete('sessions')
  @ApiOperation({ summary: 'Revoke all sessions except current' })
  @ApiResponse({ status: 200, description: 'All other sessions revoked.' })
  async revokeAllSessions(
    @CurrentUser() user: any,
    @Req() request: FastifyRequest,
  ) {
    const currentSessionId = this.resolveCurrentSessionId(user, request);
    const result = await this.authService.revokeAllSessions(
      user.sub,
      currentSessionId,
    );

    this.auditService.log(
      {
        action: 'AUTH_SESSIONS_REVOKE_ALL',
        resourceType: 'session',
        resourceId: user.sub,
        userId: user.sub,
        newValue: { revoked: true },
      },
      request,
    );

    return result;
  }

  /**
   * Resolves the id of the session making the request.
   */
  private resolveCurrentSessionId(
    user: any,
    request: FastifyRequest,
  ): string | null {
    if (typeof user?.sessionId === 'string') {
      return user.sessionId;
    }

    const cookie = request.cookies['refresh_token'];
    if (cookie) {
      const result = request.unsignCookie(cookie);
      if (result.valid && result.value) {
        return result.value.split(':')[0];
      }
    }
    return null;
  }

  private setRefreshCookie(reply: FastifyReply, token: string) {
    reply.setCookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60,
      signed: true,
    });
  }
}
