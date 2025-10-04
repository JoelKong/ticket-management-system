import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from '../common/entities/like.entity';
import { Post } from '../common/entities/post.entity';
import { PostCountEvent } from '../common/entities/post-count-event.entity';
import { EventStatus } from 'src/common/enums/like-status.enum';

@Injectable()
export class LikeRepository {
  private readonly logger = new Logger(LikeRepository.name);

  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostCountEvent)
    private readonly postCountEventRepository: Repository<PostCountEvent>,
  ) {}

  async createLike(postId: number, userId: number): Promise<Like> {
    this.logger.log(`Creating like record for post ${postId}, user ${userId}`);

    const like = this.likeRepository.create({
      post_id: postId,
      user_id: userId,
    });

    return this.likeRepository.save(like);
  }

  async findLikeByPostAndUser(
    postId: number,
    userId: number,
  ): Promise<Like | null> {
    return this.likeRepository.findOne({
      where: { post_id: postId, user_id: userId },
    });
  }

  async deleteLike(postId: number, userId: number): Promise<void> {
    this.logger.log(`Deleting like for post ${postId} and user ${userId}`);
    await this.likeRepository.delete({
      post_id: postId,
      user_id: userId,
    });
  }

  async getLikeCount(postId: number): Promise<number> {
    this.logger.log(`Getting like count for post ${postId} from database`);
    return this.likeRepository.count({
      where: { post_id: postId },
    });
  }

  async ensurePostExists(postId: number): Promise<Post> {
    this.logger.log(`Ensuring post ${postId} exists`);

    let post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      this.logger.log(`Creating new post record for ${postId}`);
      const likeCount = await this.getLikeCount(postId);
      post = this.postRepository.create({
        id: postId,
        like_count: likeCount,
      });
      post = await this.postRepository.save(post);
    }

    return post;
  }

  async updatePostLikeCount(postId: number, delta: number): Promise<void> {
    this.logger.log(`Updating post ${postId} like count by ${delta}`);

    await this.postRepository
      .createQueryBuilder()
      .update(Post)
      .set({
        like_count: () => `like_count + ${delta}`,
      })
      .where('id = :id', { id: postId })
      .execute();
  }

  async recordPostCountEvent(
    eventId: string,
    postId: number,
    delta: number,
    status: EventStatus = EventStatus.PENDING,
  ): Promise<PostCountEvent> {
    this.logger.log(`Recording post count event ${eventId} for post ${postId}`);

    const event = this.postCountEventRepository.create({
      event_id: eventId,
      post_id: postId,
      delta,
      status,
      retry_count: 0,
    });

    return this.postCountEventRepository.save(event);
  }

  async findPostCountEventById(
    eventId: string,
  ): Promise<PostCountEvent | null> {
    return this.postCountEventRepository.findOne({
      where: { event_id: eventId },
    });
  }

  async updatePostCountEventStatus(
    eventId: string,
    status: EventStatus,
    retryCount: number,
  ): Promise<void> {
    await this.postCountEventRepository.update(
      { event_id: eventId },
      { status, retry_count: retryCount },
    );
  }
}
