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
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
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
  PAYLOAD_TOO_LARGE: { status: HttpStatus.PAYLOAD_TOO_LARGE, title: 'Request body too large' },
  INTERNAL_ERROR: { status: HttpStatus.INTERNAL_SERVER_ERROR, title: 'Internal server error' },
  SERVICE_UNAVAILABLE: { status: HttpStatus.SERVICE_UNAVAILABLE, title: 'Service unavailable' },
};
