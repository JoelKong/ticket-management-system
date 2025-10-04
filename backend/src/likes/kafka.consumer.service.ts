import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { LikeRepository } from './like.repository';
import { EachMessagePayload } from 'kafkajs';
import { ExponentialBackoff } from 'src/common/utils/exponential-backoff.util';
import type { RetryOptions } from 'src/common/utils/exponential-backoff.util';
import { PostCountEventDto } from 'src/kafka/events/kafka.event.dto';
import { KafkaService } from 'src/kafka/kafka.service';
import { StateMachine } from 'src/common/statemachine/statemachine';

import { PostCountEvent } from 'src/common/entities/post-count-event.entity';
import { EventStatus } from 'src/common/enums/like-status.enum';
import { eventTransitions } from 'src/common/statemachine/likes/like.state-machine';
import { EventStatusEvent } from 'src/common/statemachine/likes/like.state-machine.events';

@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private readonly retryOptions: RetryOptions = {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
  };
  private readonly stateMachine: StateMachine<
    EventStatus,
    EventStatusEvent,
    PostCountEvent
  >;

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly likeRepository: LikeRepository,
  ) {
    this.stateMachine = new StateMachine();
    this.stateMachine.register(eventTransitions);
  }

  async onModuleInit() {
    await this.kafkaService.consumePostCountEvents(
      this.handlePostCountEvent.bind(this),
    );
  }

  private async handlePostCountEvent(
    payload: EachMessagePayload,
  ): Promise<void> {
    const { message } = payload;

    try {
      const postCountEvent: PostCountEventDto = JSON.parse(
        message.value?.toString() || '{}',
      );
      this.logger.log(
        `Processing post count event: ${postCountEvent.event_id}`,
      );

      await this.processPostCountEventWithRetry(postCountEvent);
    } catch (error) {
      this.logger.error(
        'Failed to parse post count event message',
        error.stack,
      );
      await this.kafkaService.sendToDeadLetterQueue(message, error as Error);
    }
  }

  private async processPostCountEventWithRetry(
    postCountEvent: PostCountEventDto,
  ): Promise<void> {
    // Create or get existing event record
    let eventRecord = await this.likeRepository.findPostCountEventById(
      postCountEvent.event_id,
    );

    if (!eventRecord) {
      eventRecord = await this.likeRepository.recordPostCountEvent(
        postCountEvent.event_id,
        postCountEvent.post_id,
        postCountEvent.delta,
        EventStatus.PENDING,
      );
    }

    try {
      await ExponentialBackoff.execute(
        () => this.processPostCountEvent(postCountEvent, eventRecord!),
        this.retryOptions,
        `PostCountEvent-${postCountEvent.event_id}`,
      );

      // Mark as successful
      const newStatus = this.stateMachine.trigger(
        eventRecord.status as EventStatus,
        EventStatusEvent.SET_SUCCESS,
        eventRecord,
      );
      await this.likeRepository.updatePostCountEventStatus(
        eventRecord.event_id,
        newStatus,
        eventRecord.retry_count,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process post count event ${postCountEvent.event_id} after all retries`,
        error.stack,
      );

      // Mark as failed
      const newStatus = this.stateMachine.trigger(
        eventRecord.status as EventStatus,
        EventStatusEvent.SET_FAILED,
        eventRecord,
      );
      await this.likeRepository.updatePostCountEventStatus(
        eventRecord.event_id,
        newStatus,
        eventRecord.retry_count,
      );

      await this.kafkaService.sendToDeadLetterQueue(
        { key: postCountEvent.event_id, value: JSON.stringify(postCountEvent) },
        error as Error,
      );
    }
  }

  private async processPostCountEvent(
    postCountEvent: PostCountEventDto,
    eventRecord: PostCountEvent,
  ): Promise<void> {
    const { event_id, post_id, delta } = postCountEvent;

    // Skip if already successful
    if (eventRecord.status === EventStatus.SUCCESS) {
      this.logger.log(
        `Event ${event_id} already processed successfully, skipping`,
      );
      return;
    }

    try {
      // Mark as retrying if not first attempt
      if (eventRecord.retry_count > 0) {
        const newStatus = this.stateMachine.trigger(
          eventRecord.status as EventStatus,
          EventStatusEvent.SET_RETRYING,
          eventRecord,
        );
        await this.likeRepository.updatePostCountEventStatus(
          event_id,
          newStatus,
          eventRecord.retry_count,
        );
      }

      // Ensure post exists
      await this.likeRepository.ensurePostExists(post_id);

      // Update post like count
      await this.likeRepository.updatePostLikeCount(post_id, delta);

      this.logger.log(
        `Successfully processed post count event: ${event_id} (post: ${post_id}, delta: ${delta})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process post count event: ${event_id}`,
        error.stack,
      );
      throw error;
    }
  }
}
