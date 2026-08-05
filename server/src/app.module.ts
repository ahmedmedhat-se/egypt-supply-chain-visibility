import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import configuration from './config/configuration';
import { validationSchema } from './config/validation';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { MailModule } from './mail/mail.module';
import { QueueModule } from './queue/queue.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { AdminModule } from './admin/admin.module';
import { CheckpointsModule } from './checkpoints/checkpoints.module';
import { RoutesModule } from './routes/routes.module';
import { DashboardModule } from './dashboard/dashboard.module';

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100, // 100 requests per minute max globally
        },
      ],
      // Only HTTP requests are rate-limited; RabbitMQ and WebSocket
      skipIf: (context) => context.getType() !== 'http',
    }),
    PrismaModule,
    RedisModule,
    UsersModule,
    AuthModule,
    OrganizationsModule,
    MailModule,
    QueueModule,
    ShipmentsModule,
    AdminModule,
    CheckpointsModule,
    RoutesModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
