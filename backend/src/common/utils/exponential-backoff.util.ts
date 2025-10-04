import { Logger } from '@nestjs/common';

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

export class ExponentialBackoff {
  private static readonly logger = new Logger(ExponentialBackoff.name);

  static async execute<T>(
    operation: () => Promise<T>,
    options: RetryOptions,
    context: string = 'operation',
  ): Promise<T> {
    let lastError: Error = new Error(
      'ExponentialBackoff: No error captured during retries',
    );

    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.min(
            options.baseDelay * Math.pow(2, attempt - 1),
            options.maxDelay,
          );

          this.logger.log(
            `${context} - Attempt ${attempt}/${options.maxRetries}, waiting ${delay}ms before retry`,
          );

          await this.sleep(delay);
        }

        return await operation();
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `${context} - Attempt ${attempt + 1}/${options.maxRetries + 1} failed: ${error.message}`,
        );

        if (attempt === options.maxRetries) {
          this.logger.error(`${context} - All retry attempts exhausted`);
          break;
        }
      }
    }

    throw lastError;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
