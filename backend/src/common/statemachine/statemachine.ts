import {
  IStateMachine,
  StateMachineError,
  StateMachineErrorCode,
  Transition,
} from './Istatemachine';

type TransitionKey<S, E> = `${string & S}:${string & E}`;
type TransitionStore<S, E, C> = Map<TransitionKey<S, E>, Transition<S, E, C>>;

export class StateMachine<S extends string, E extends string, C>
  implements IStateMachine<S, E, C>
{
  private transitions: TransitionStore<S, E, C>;

  constructor() {
    this.transitions = new Map();
  }

  private getTransition(fromState: S, event: E): Transition<S, E, C> {
    if (fromState === undefined || fromState === null) {
      throw new StateMachineError(
        'Invalid fromState: state cannot be undefined or null',
        StateMachineErrorCode.TechnicalError,
      );
    }

    if (event === undefined || event === null) {
      throw new StateMachineError(
        'Invalid event: event cannot be undefined or null',
        StateMachineErrorCode.TechnicalError,
      );
    }

    try {
      const key = this.createTransitionKey(fromState, event);
      const transition = this.transitions.get(key);
      if (!transition) {
        throw new StateMachineError(
          `No transition found for state '${fromState}' and event '${event}'`,
          StateMachineErrorCode.TransitionNotAllowed,
        );
      }
      return transition;
    } catch (error) {
      if (error instanceof StateMachineError) {
        throw error;
      }
      throw new StateMachineError(
        `Failed to get transition: ${error instanceof Error ? error.message : String(error)}`,
        StateMachineErrorCode.TechnicalError,
      );
    }
  }

  trigger(fromState: S, event: E, context?: C): S {
    if (fromState === undefined || fromState === null) {
      throw new StateMachineError(
        'Invalid fromState: state cannot be undefined or null',
        StateMachineErrorCode.TechnicalError,
      );
    }

    if (event === undefined || event === null) {
      throw new StateMachineError(
        'Invalid event: event cannot be undefined or null',
        StateMachineErrorCode.TechnicalError,
      );
    }

    const transition = this.getTransition(fromState, event);

    try {
      for (const handler of transition.handlers) {
        handler(fromState, transition.toState, event, context);
      }
      return transition.toState;
    } catch (handlerError) {
      const errorMessage =
        handlerError instanceof Error
          ? handlerError.message
          : String(handlerError);
      throw new StateMachineError(
        `Failed to execute transition handlers for event '${event}' from state '${fromState}': ${errorMessage}`,
        StateMachineErrorCode.TechnicalError,
      );
    }
  }

  private createTransitionKey(fromState: S, event: E): TransitionKey<S, E> {
    return `${fromState}:${event}`;
  }

  register(transitions: Transition<S, E, C>[]): void {
    if (!transitions || transitions.length === 0) {
      throw new StateMachineError(
        'At least one transition must be provided',
        StateMachineErrorCode.TransitionNotFound,
      );
    }

    transitions.forEach((transition, index) => {
      const { fromState, toState, stateMachineEvent, handlers } = transition;

      if (!fromState || !toState) {
        throw new StateMachineError(
          `Invalid transition at index ${index}: fromState and toState must be provided`,
          StateMachineErrorCode.StateNotFound,
        );
      }

      if (!stateMachineEvent) {
        throw new StateMachineError(
          `Invalid transition at index ${index}: stateMachineEvent must be provided`,
          StateMachineErrorCode.EventNotRecognized,
        );
      }

      const key = this.createTransitionKey(fromState, stateMachineEvent);

      this.transitions.set(key, {
        fromState,
        toState,
        stateMachineEvent,
        handlers,
      });
    });
  }
}
