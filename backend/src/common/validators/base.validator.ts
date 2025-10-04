import { ValidatorInterface } from './validator.interface';

export abstract class BaseValidator<T> implements ValidatorInterface<T> {
  // To be implemented by concrete validators
  protected abstract handleValidation(data: T): string | null;

  public validate(data: T): string | null {
    return this.handleValidation(data);
  }
}
