import { HttpStatus, ValidationPipe, type ValidationError } from '@nestjs/common';
import { AppException } from './app.exception.js';
import { ErrorCode } from './error-codes.js';

export interface FieldError {
  field: string;
  constraints: string[];
}

/**
 * Flattens nested class-validator errors into `{ field: 'a.b', constraints: [...] }`.
 * Constraint names are sorted so the response does not depend on decorator order.
 */
export function toFieldErrors(errors: ValidationError[], parentPath = ''): FieldError[] {
  return errors.flatMap((error) => {
    const field = parentPath ? `${parentPath}.${error.property}` : error.property;
    const own: FieldError[] = error.constraints
      ? [{ field, constraints: Object.keys(error.constraints).sort() }]
      : [];
    return [...own, ...toFieldErrors(error.children ?? [], field)];
  });
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) =>
      new AppException(
        ErrorCode.VALIDATION_FAILED,
        'Request validation failed',
        HttpStatus.BAD_REQUEST,
        toFieldErrors(errors),
      ),
  });
}
