import { HttpException, HttpStatus } from '@nestjs/common';
import type { ErrorCode, ErrorResponseBody } from './error-codes.js';

/** HTTP exception carrying a stable error code. Throw this from services. */
export class AppException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    message: string,
    status: HttpStatus,
    readonly details?: unknown,
  ) {
    const body: ErrorResponseBody = {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    };
    super(body, status);
  }
}
