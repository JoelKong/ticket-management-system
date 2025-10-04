import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { CORRELATION_ID_HEADER } from '../middlewares/correlation-id';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
      correlationId: request[CORRELATION_ID_HEADER],
      message:
        exception instanceof HttpException
          ? (() => {
              try {
                const response = exception.getResponse();
                if (typeof response === 'string') {
                  return response;
                }
                if (
                  response &&
                  typeof response === 'object' &&
                  'message' in response
                ) {
                  return (response as any).message;
                }
                return 'An error occurred';
              } catch (error) {
                return 'An error occurred';
              }
            })()
          : 'Internal server error',
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
