import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private readonly LIKE_COUNT_TTL = 10;

  constructor(private configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });
  }

  async getLikeCount(postId: number): Promise<number | null> {
    const key = `post:${postId}:like_count`;
    const count = await this.client.get(key);
    return count ? parseInt(count, 10) : null;
  }

  async setLikeCountWithTTL(postId: number, count: number): Promise<void> {
    const key = `post:${postId}:like_count`;
    await this.client.setex(key, this.LIKE_COUNT_TTL, count);
    this.logger.debug(
      `Set Redis cache for post ${postId}: ${count} (TTL: ${this.LIKE_COUNT_TTL}s)`,
    );
  }

  async deleteLikeCount(postId: number): Promise<void> {
    const key = `post:${postId}:like_count`;
    await this.client.del(key);
    this.logger.debug(`Deleted Redis cache for post ${postId}`);
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
