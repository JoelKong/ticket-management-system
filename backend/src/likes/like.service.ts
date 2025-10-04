import { Injectable, Logger } from '@nestjs/common';
import { LikeRepository } from './like.repository';
import { LikeRequestDto } from './dtos/request/like.request.dto';
import { LikeResponseDto } from './dtos/response/like.response.dto';
import { LikeCountResponseDto } from './dtos/response/like-count.response.dto';
import { v4 as uuidv4 } from 'uuid';
import { PostCountEventDto } from 'src/kafka/events/kafka.event.dto';
import { KafkaService } from 'src/kafka/kafka.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class LikeService {
  private readonly logger = new Logger(LikeService.name);

  constructor(
    private readonly likeRepository: LikeRepository,
    private readonly redisService: RedisService,
    private readonly kafkaService: KafkaService,
  ) {}

  async toggleLike(likeRequestDto: LikeRequestDto): Promise<LikeResponseDto> {
    const { post_id, user_id } = likeRequestDto;

    this.logger.log(
      `Processing like toggle for post ${post_id}, user ${user_id}`,
    );

    try {
      // Ensure post exists
      await this.likeRepository.ensurePostExists(post_id);

      // Check if user already liked this post
      const existingLike = await this.likeRepository.findLikeByPostAndUser(
        post_id,
        user_id,
      );

      let message: string;
      let delta: number;
      let isLiked: boolean;

      if (existingLike) {
        // Unlike - remove from likes table
        await this.likeRepository.deleteLike(post_id, user_id);
        delta = -1;
        message = 'Post unliked successfully';
        isLiked = false;

        this.logger.log(`User ${user_id} unliked post ${post_id}`);
      } else {
        // Like - add to likes table
        await this.likeRepository.createLike(post_id, user_id);
        delta = 1;
        message = 'Post liked successfully';
        isLiked = true;

        this.logger.log(`User ${user_id} liked post ${post_id}`);
      }

      // Invalidate Redis cache for this post
      await this.redisService.deleteLikeCount(post_id);

      // Create event for Kafka to update post count
      const eventId = uuidv4();
      const postCountEvent: PostCountEventDto = {
        event_id: eventId,
        post_id,
        delta,
        timestamp: new Date(),
      };

      // Produce event to Kafka for asynchronous post count update
      await this.kafkaService.producePostCountEvent(postCountEvent);

      return {
        success: true,
        message,
        isLiked,
      };
    } catch (error) {
      this.logger.error(
        `Failed to toggle like for post ${post_id}, user ${user_id}`,
        error.stack,
      );
      return {
        success: false,
        message: 'Failed to process like',
      };
    }
  }

  async getLikeCount(postId: number): Promise<LikeCountResponseDto> {
    this.logger.log(`Fetching like count for post ${postId}`);

    try {
      // Try to get count from Redis first
      let count = await this.redisService.getLikeCount(postId);

      if (count === null) {
        // Cache miss - get from database
        this.logger.log(`Redis cache miss for post ${postId}, querying DB`);

        await this.likeRepository.ensurePostExists(postId);
        count = await this.likeRepository.getLikeCount(postId);

        // Update Redis cache with TTL
        await this.redisService.setLikeCountWithTTL(postId, count);

        this.logger.log(
          `Updated Redis cache for post ${postId} with count ${count}`,
        );
      } else {
        this.logger.log(`Redis cache hit for post ${postId}, count: ${count}`);
      }

      return {
        count,
        post_id: postId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch like count for post ${postId}`,
        error.stack,
      );

      // Fallback to DB if Redis fails
      try {
        await this.likeRepository.ensurePostExists(postId);
        const dbCount = await this.likeRepository.getLikeCount(postId);
        return {
          count: dbCount,
          post_id: postId,
        };
      } catch (dbError) {
        this.logger.error(
          `DB fallback also failed for post ${postId}`,
          dbError.stack,
        );
        return {
          count: 0,
          post_id: postId,
        };
      }
    }
  }

  async getLikeCountWithUserStatus(
    postId: number,
    userId?: number,
  ): Promise<LikeCountResponseDto> {
    const result = await this.getLikeCount(postId);

    if (userId) {
      const isLiked = await this.getUserLikeStatus(postId, userId);
      return {
        ...result,
        isLiked,
        user_id: userId,
      };
    }

    return result;
  }

  async getUserLikeStatus(postId: number, userId: number): Promise<boolean> {
    try {
      const like = await this.likeRepository.findLikeByPostAndUser(
        postId,
        userId,
      );
      return !!like;
    } catch (error) {
      this.logger.error(
        `Failed to get user like status for post ${postId}, user ${userId}`,
        error.stack,
      );
      return false;
    }
  }
}
