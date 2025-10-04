export enum StateMachineErrorCode {
  TransitionNotAllowed = 'TRANSITION_NOT_ALLOWED',
  TransitionNotFound = 'TRANSITION_NOT_FOUND',
  HandlerError = 'HANDLER_ERROR',
  StateNotFound = 'STATE_NOT_FOUND',
  EventNotRecognized = 'EVENT_NOT_RECOGNIZED',
  TechnicalError = 'TECHNICAL_ERROR',
}

export class StateMachineError extends Error {
  constructor(
    message: string,
    public code: StateMachineErrorCode,
  ) {
    super(message);
    this.name = 'StateMachineError';
  }
}

export type StateMachineEventHandler<S, E, C> = (
  fromState: S,
  toState: S,
  event: E,
  context?: C,
) => void;

export interface Transition<S, E, C> {
  fromState: S;
  toState: S;
  stateMachineEvent: E;
  handlers: StateMachineEventHandler<S, E, C>[];
}

export interface IStateMachine<S, E, C> {
  trigger(fromState: S, event: E, context?: C): S;
  register(transitions: Transition<S, E, C>[]): void;
}
