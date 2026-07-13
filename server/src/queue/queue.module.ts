import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailConsumer } from './consumers/email.consumer';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        exchanges: [
          {
            name: 'escv.events',
            type: 'topic',
          },
        ],
        uri: config.get<string>('RABBITMQ_URL'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EmailConsumer],
  exports: [RabbitMQModule],
})
export class QueueModule {}
