import {
  Controller,
  Get,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Public } from '../common/decorators/public.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

type DependencyStatus = { status: 'up' | 'down' };

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private async databaseStatus(): Promise<DependencyStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up' };
    } catch {
      return { status: 'down' };
    }
  }

  private async redisStatus(): Promise<DependencyStatus> {
    try {
      await this.redis.ping();
      return { status: 'up' };
    } catch {
      return { status: 'down' };
    }
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Overall application health (database + redis)' })
  async health(@Res({ passthrough: true }) reply: FastifyReply) {
    const [database, redis] = await Promise.all([
      this.databaseStatus(),
      this.redisStatus(),
    ]);
    const ok = database.status === 'up' && redis.status === 'up';
    reply.status(ok ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return {
      status: ok ? 'ok' : 'error',
      info: { database, redis },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('db')
  @Public()
  @ApiOperation({ summary: 'Database connectivity check' })
  async db(@Res({ passthrough: true }) reply: FastifyReply) {
    const database = await this.databaseStatus();
    reply.status(
      database.status === 'up'
        ? HttpStatus.OK
        : HttpStatus.SERVICE_UNAVAILABLE,
    );
    return {
      status: database.status,
      info: { database },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('redis')
  @Public()
  @ApiOperation({ summary: 'Redis connectivity check' })
  async redisCheck(@Res({ passthrough: true }) reply: FastifyReply) {
    const redis = await this.redisStatus();
    reply.status(
      redis.status === 'up' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE,
    );
    return {
      status: redis.status,
      info: { redis },
      timestamp: new Date().toISOString(),
    };
  }
}
