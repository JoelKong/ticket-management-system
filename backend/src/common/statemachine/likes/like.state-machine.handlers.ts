import { StateMachineEventHandler } from '../Istatemachine';
import { PostCountEvent } from '../../entities/post-count-event.entity';
import { EventStatus } from 'src/common/enums/like-status.enum';
import { EventStatusEvent } from './like.state-machine.events';

export type EventStateHandler = StateMachineEventHandler<
  EventStatus,
  EventStatusEvent,
  PostCountEvent
>;

export class EventStateHandlers {
  public static setStatusHandler: EventStateHandler = (
    fromState,
    toState,
    event,
    entity,
  ) => {
    if (entity) {
      entity.status = toState;

      // Increment retry count when moving to retrying state
      if (toState === EventStatus.RETRYING) {
        entity.retry_count = (entity.retry_count || 0) + 1;
      }
    } else {
      throw new Error(
        `State machine handler for event '${event}' from '${fromState}' to '${toState}' was called without an entity.`,
      );
    }
  };
}
