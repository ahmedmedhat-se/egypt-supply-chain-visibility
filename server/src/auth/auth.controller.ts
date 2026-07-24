import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
  Get,
  Query,
  BadRequestException,
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

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new organization and user' })
  @ApiResponse({ status: 201, description: 'Successfully registered.' })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.authService.register(dto);

    this.setRefreshCookie(reply, result.refreshToken);
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
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.authService.login(dto.email, dto.password);

    this.setRefreshCookie(reply, result.refreshToken);
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
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.authService.acceptInvitation(dto);
    this.setRefreshCookie(reply, result.refreshToken);
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @ApiOperation({ summary: 'Refresh access token' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const cookie = request.cookies['refresh_token'];
    if (!cookie) throw new UnauthorizedException('No refresh token');

    const result = await this.authService.refreshToken(cookie);

    this.setRefreshCookie(reply, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const cookie = request.cookies['refresh_token'];
    if (cookie) {
      await this.authService.logout(cookie);
    }
    reply.clearCookie('refresh_token', { path: '/api/auth/refresh' });
    return;
  }

  private setRefreshCookie(reply: FastifyReply, token: string) {
    reply.setCookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60,
      signed: true,
    });
  }
}
