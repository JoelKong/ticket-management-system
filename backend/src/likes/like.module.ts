import { Module } from '@nestjs/common';
import { LikeController } from './like.controller';
import { LikeService } from './like.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from '../common/entities/like.entity';
import { Post } from '../common/entities/post.entity';
import { PostCountEvent } from '../common/entities/post-count-event.entity';
import { LikeRepository } from './like.repository';
import { KafkaService } from 'src/kafka/kafka.service';
import { RedisService } from 'src/redis/redis.service';
import { KafkaConsumerService } from './kafka.consumer.service';

@Module({
  imports: [TypeOrmModule.forFeature([Like, Post, PostCountEvent])],
  controllers: [LikeController],
  providers: [
    LikeService,
    LikeRepository,
    RedisService,
    KafkaService,
    KafkaConsumerService,
  ],
  exports: [LikeService, LikeRepository, RedisService, KafkaService],
})
export class LikeModule {}
