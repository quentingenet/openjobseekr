import { HttpException } from '@nestjs/common';
import { ERROR_CATALOG, type ErrorCode } from './error-codes.js';

export interface FieldError {
  field: string;
  constraints: string[];
}

/**
 * Error with a stable code; its HTTP status and title come from `ERROR_CATALOG`.
 * The global filter turns it into an RFC 9457 problem.
 */
export class AppException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    /** Developer message specific to this occurrence (RFC 9457 `detail`). */
    readonly detail?: string,
    /** Invalid fields, for VALIDATION_FAILED. */
    readonly errors?: FieldError[],
  ) {
    super(detail ?? ERROR_CATALOG[code].title, ERROR_CATALOG[code].status);
  }
}
