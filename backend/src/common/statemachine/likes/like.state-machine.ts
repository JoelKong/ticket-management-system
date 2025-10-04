import { Transition } from '../Istatemachine';
import { PostCountEvent } from '../../entities/post-count-event.entity';
import { EventStateHandlers } from './like.state-machine.handlers';
import { EventStatus } from 'src/common/enums/like-status.enum';
import { EventStatusEvent } from './like.state-machine.events';

export const eventTransitions: Transition<
  EventStatus,
  EventStatusEvent,
  PostCountEvent
>[] = [
  {
    fromState: EventStatus.PENDING,
    toState: EventStatus.RETRYING,
    stateMachineEvent: EventStatusEvent.SET_RETRYING,
    handlers: [EventStateHandlers.setStatusHandler],
  },
  {
    fromState: EventStatus.PENDING,
    toState: EventStatus.SUCCESS,
    stateMachineEvent: EventStatusEvent.SET_SUCCESS,
    handlers: [EventStateHandlers.setStatusHandler],
  },
  {
    fromState: EventStatus.PENDING,
    toState: EventStatus.FAILED,
    stateMachineEvent: EventStatusEvent.SET_FAILED,
    handlers: [EventStateHandlers.setStatusHandler],
  },
  {
    fromState: EventStatus.RETRYING,
    toState: EventStatus.SUCCESS,
    stateMachineEvent: EventStatusEvent.SET_SUCCESS,
    handlers: [EventStateHandlers.setStatusHandler],
  },
  {
    fromState: EventStatus.RETRYING,
    toState: EventStatus.FAILED,
    stateMachineEvent: EventStatusEvent.SET_FAILED,
    handlers: [EventStateHandlers.setStatusHandler],
  },
  {
    fromState: EventStatus.RETRYING,
    toState: EventStatus.RETRYING,
    stateMachineEvent: EventStatusEvent.SET_RETRYING,
    handlers: [EventStateHandlers.setStatusHandler],
  },
];
