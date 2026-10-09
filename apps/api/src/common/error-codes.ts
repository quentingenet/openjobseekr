import { HttpStatus } from '@nestjs/common';

/** Stable, language-neutral error codes. The web app translates them. */
export const ErrorCode = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  APPLICATION_NOT_FOUND: 'APPLICATION_NOT_FOUND',
  SKILL_NOT_FOUND: 'SKILL_NOT_FOUND',
  CONFLICT: 'CONFLICT',
  EMAIL_ALREADY_USED: 'EMAIL_ALREADY_USED',
  SKILL_NAME_ALREADY_USED: 'SKILL_NAME_ALREADY_USED',
  FOLLOW_UP_NOT_EXPECTED: 'FOLLOW_UP_NOT_EXPECTED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  IMPORT_UNSUPPORTED_FILE: 'IMPORT_UNSUPPORTED_FILE',
  IMPORT_INVALID_STRUCTURE: 'IMPORT_INVALID_STRUCTURE',
  IMPORT_INVALID_DATA: 'IMPORT_INVALID_DATA',
  IMPORT_TOO_MANY_ROWS: 'IMPORT_TOO_MANY_ROWS',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** HTTP status and RFC 9457 title of every error code: the single place to define them. */
export const ERROR_CATALOG: Record<ErrorCode, { status: HttpStatus; title: string }> = {
  VALIDATION_FAILED: { status: HttpStatus.BAD_REQUEST, title: 'Validation failed' },
  BAD_REQUEST: { status: HttpStatus.BAD_REQUEST, title: 'Bad request' },
  UNAUTHORIZED: { status: HttpStatus.UNAUTHORIZED, title: 'Authentication required' },
  INVALID_CREDENTIALS: { status: HttpStatus.UNAUTHORIZED, title: 'Invalid email or password' },
  FORBIDDEN: { status: HttpStatus.FORBIDDEN, title: 'Forbidden' },
  NOT_FOUND: { status: HttpStatus.NOT_FOUND, title: 'Not found' },
  APPLICATION_NOT_FOUND: { status: HttpStatus.NOT_FOUND, title: 'Application not found' },
  SKILL_NOT_FOUND: { status: HttpStatus.NOT_FOUND, title: 'Skill not found' },
  CONFLICT: { status: HttpStatus.CONFLICT, title: 'Conflict' },
  EMAIL_ALREADY_USED: { status: HttpStatus.CONFLICT, title: 'Email already used' },
  SKILL_NAME_ALREADY_USED: { status: HttpStatus.CONFLICT, title: 'Skill name already used' },
  FOLLOW_UP_NOT_EXPECTED: {
    status: HttpStatus.CONFLICT,
    title: 'Application not waiting for an answer',
  },
  PAYLOAD_TOO_LARGE: { status: HttpStatus.PAYLOAD_TOO_LARGE, title: 'Request body too large' },
  IMPORT_UNSUPPORTED_FILE: {
    status: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    title: 'Not an .xlsx or .ods spreadsheet',
  },
  IMPORT_INVALID_STRUCTURE: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    title: 'Spreadsheet layout not recognized',
  },
  IMPORT_INVALID_DATA: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    title: 'Spreadsheet has invalid cells',
  },
  IMPORT_TOO_MANY_ROWS: { status: HttpStatus.UNPROCESSABLE_ENTITY, title: 'Spreadsheet too large' },
  TOO_MANY_REQUESTS: { status: HttpStatus.TOO_MANY_REQUESTS, title: 'Too many requests' },
  INTERNAL_ERROR: { status: HttpStatus.INTERNAL_SERVER_ERROR, title: 'Internal server error' },
  SERVICE_UNAVAILABLE: { status: HttpStatus.SERVICE_UNAVAILABLE, title: 'Service unavailable' },
};
