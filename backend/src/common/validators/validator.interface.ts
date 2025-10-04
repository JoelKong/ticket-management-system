export interface ValidatorInterface<T> {
  validate(data: T): string | null;
}
