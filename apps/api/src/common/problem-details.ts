import { HttpException, HttpStatus } from '@nestjs/common';
import { appExceptionFromPrismaError } from '../prisma/prisma-errors.js';
import { AppException, type FieldError } from './app.exception.js';
import { ERROR_CATALOG, ErrorCode } from './error-codes.js';

export const PROBLEM_CONTENT_TYPE = 'application/problem+json';

/** RFC 9457 problem details, extended with the stable `code` and the invalid fields. */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance: string;
  code: ErrorCode;
  errors?: FieldError[];
}

/** `APPLICATION_NOT_FOUND` -> `urn:openjobseekr:error:application-not-found`. */
export function problemType(code: ErrorCode): string {
  return `urn:openjobseekr:error:${code.toLowerCase().replaceAll('_', '-')}`;
}

const codeByStatus: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.PAYLOAD_TOO_LARGE]: ErrorCode.PAYLOAD_TOO_LARGE,
  [HttpStatus.SERVICE_UNAVAILABLE]: ErrorCode.SERVICE_UNAVAILABLE,
};

/** Express body-parser rejects bodies above the JSON limit with this error type. */
function isBodyTooLargeError(exception: unknown): boolean {
  return (exception as { type?: unknown } | null)?.type === 'entity.too.large';
}

/** Any error thrown while handling a request, as an AppException. */
function toAppException(exception: unknown): AppException {
  if (exception instanceof AppException) return exception;
  const fromPrisma = appExceptionFromPrismaError(exception);
  if (fromPrisma) return fromPrisma;
  if (isBodyTooLargeError(exception)) return new AppException(ErrorCode.PAYLOAD_TOO_LARGE);
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const code =
      codeByStatus[status] ?? (status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.BAD_REQUEST);
    return new AppException(code, exception.message);
  }
  // Unexpected errors never expose their message (it may contain internal details).
  return new AppException(ErrorCode.INTERNAL_ERROR);
}

export function toProblemDetails(exception: unknown, instance: string): ProblemDetails {
  const { code, detail, errors } = toAppException(exception);
  const { title } = ERROR_CATALOG[code];
  // A framework exception keeps its own status (e.g. 422, 429) even when its code is generic.
  const status =
    exception instanceof HttpException && !(exception instanceof AppException)
      ? exception.getStatus()
      : ERROR_CATALOG[code].status;
  return {
    type: problemType(code),
    title,
    status,
    ...(detail === undefined ? {} : { detail }),
    instance,
    code,
    ...(errors === undefined ? {} : { errors }),
  };
}
