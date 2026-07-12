import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import type { FastifyReply, FastifyRequest } from 'fastify';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(
    @Body() dto: any,
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
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.authService.login(email, password);

    this.setRefreshCookie(reply, result.refreshToken);
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
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
    reply.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
    return;
  }

  private setRefreshCookie(reply: FastifyReply, token: string) {
    reply.setCookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth/refresh',
      maxAge: 7 * 24 * 60 * 60,
      signed: true,
    });
  }
}
