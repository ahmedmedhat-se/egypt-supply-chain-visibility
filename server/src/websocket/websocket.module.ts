import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '../redis/redis.module';
import { QueueModule } from '../queue/queue.module';
import { WebsocketGateway } from './websocket.gateway';
import { WebsocketConsumer } from './websocket.consumer';

@Module({
  imports: [
    QueueModule,
    RedisModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.accessSecret'),
        signOptions: {
          expiresIn: config.get<number>('jwt.accessExpiration'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [WebsocketGateway, WebsocketConsumer],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
