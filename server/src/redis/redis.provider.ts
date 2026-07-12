import { Provider, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (config: ConfigService): Redis => {
    const logger = new Logger('RedisClient');

    const client = new Redis({
      host: config.get<string>('redis.host'),
      port: config.get<number>('redis.port'),
      retryStrategy(times: number) {
        if (times > 10) {
          logger.error('Retry limit reached');
          return null;
        }
        const delay = Math.min(times * 200, 2000);
        logger.warn(`Retry ${times}, waiting ${delay}ms`);
        return delay;
      },
      reconnectOnError(err: Error) {
        const targets = ['READONLY', 'ECONNRESET'];
        return targets.some((t) => err.message.includes(t));
      },
    });

    client.on('connect', () => logger.log('Connected'));
    client.on('ready', () => logger.log('Ready'));
    client.on('error', (err) => logger.error(err.message, err.stack));
    client.on('close', () => logger.warn('Connection closed'));

    return client;
  },
  inject: [ConfigService],
};
