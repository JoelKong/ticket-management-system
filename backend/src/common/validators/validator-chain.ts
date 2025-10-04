import { ValidatorInterface } from './validator.interface';

export class ValidatorChain<T> {
  constructor(readonly validators: ValidatorInterface<T>[]) {}

  validate(data: T): string | null {
    for (const validator of this.validators) {
      const error = validator.validate(data);
      if (error) {
        return error;
      }
    }
    return null;
  }
}
