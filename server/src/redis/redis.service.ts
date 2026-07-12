import { Injectable, Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis, { ChainableCommander } from 'ioredis';
import { REDIS_CLIENT } from './redis.provider';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<'OK'> {
    if (ttlSeconds !== undefined) {
      return this.redis.set(key, value, 'EX', ttlSeconds);
    }
    return this.redis.set(key, value);
  }

  async del(...keys: string[]): Promise<number> {
    return this.redis.del(...keys);
  }

  async exists(...keys: string[]): Promise<number> {
    return this.redis.exists(...keys);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.redis.expire(key, seconds);
  }

  // ---------- Hashes ----------
  async hget(key: string, field: string): Promise<string | null> {
    return this.redis.hget(key, field);
  }

  async hset(
    key: string,
    fieldValues: Record<string, string | number>,
  ): Promise<number> {
    return this.redis.hset(key, fieldValues);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.redis.hgetall(key);
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    return this.redis.hdel(key, ...fields);
  }

  // ---------- Sets ----------
  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.redis.sadd(key, ...members);
  }

  async sismember(key: string, member: string): Promise<number> {
    return this.redis.sismember(key, member);
  }

  // ---------- Pipeline ----------
  multi(): ChainableCommander {
    return this.redis.multi();
  }

  async execMulti(
    pipeline: ChainableCommander,
  ): Promise<[error: Error | null, result: unknown][] | null> {
    try {
      return await pipeline.exec();
    } catch (err) {
      this.logger.error('Pipeline exec failed', err.stack);
      throw err;
    }
  }

  // ---------- JSON helpers ----------
  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.error(`JSON parse error for key "${key}"`, err.stack);
      throw new Error(`Invalid JSON at key "${key}"`);
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<'OK'> {
    return this.set(key, JSON.stringify(value), ttlSeconds);
  }

  // ---------- Atomic ----------
  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  // ---------- Lifecycle ----------
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Closing Redis connection...');
    await this.redis.quit();
  }
}
