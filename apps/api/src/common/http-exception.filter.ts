import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { AppException } from './app.exception.js';
import { ErrorCode, type ErrorResponseBody } from './error-codes.js';

const codeByStatus: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.PAYLOAD_TOO_LARGE]: ErrorCode.PAYLOAD_TOO_LARGE,
  [HttpStatus.SERVICE_UNAVAILABLE]: ErrorCode.SERVICE_UNAVAILABLE,
};

/** Converts any thrown error into `{ code, message, details? }`. */
export function toErrorResponse(exception: unknown): { status: number; body: ErrorResponseBody } {
  if (exception instanceof AppException) {
    return { status: exception.getStatus(), body: exception.getResponse() as ErrorResponseBody };
  }
  if (isBodyTooLargeError(exception)) {
    return {
      status: HttpStatus.PAYLOAD_TOO_LARGE,
      body: { code: ErrorCode.PAYLOAD_TOO_LARGE, message: 'Request body is too large' },
    };
  }
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const code =
      codeByStatus[status] ?? (status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.BAD_REQUEST);
    return { status, body: { code, message: exception.message } };
  }
  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    body: { code: ErrorCode.INTERNAL_ERROR, message: 'Internal server error' },
  };
}

/** Express body-parser rejects bodies above the JSON limit with this error type. */
function isBodyTooLargeError(exception: unknown): boolean {
  return (
    typeof exception === 'object' &&
    exception !== null &&
    (exception as { type?: unknown }).type === 'entity.too.large'
  );
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, body } = toErrorResponse(exception);
    if (status >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }
    host.switchToHttp().getResponse<Response>().status(status).json(body);
  }
}
