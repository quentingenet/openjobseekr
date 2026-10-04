import type { TFunction } from 'i18next';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '../api/client';
import { errorMessage } from './errors';

/** Translation key of the first failed constraint we know, in this order of importance. */
const MESSAGE_BY_CONSTRAINT: [constraint: string, key: string][] = [
  ['isNotEmpty', 'validation.required'],
  ['maxLength', 'validation.tooLong'],
  ['isCalendarDate', 'validation.date'],
  ['isRegex', 'validation.regex'],
];

export function constraintMessage(
  constraints: string[],
  extra: [constraint: string, key: string][] = [],
): string {
  const match = [...MESSAGE_BY_CONSTRAINT, ...extra].find(([constraint]) =>
    constraints.includes(constraint),
  );
  return match?.[1] ?? 'validation.invalid';
}

/**
 * Shows an API error in a React Hook Form form: invalid fields under their input, and the
 * translated error in the form banner (`errors.root.server`).
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  t: TFunction,
  extraConstraints?: [constraint: string, key: string][],
): void {
  const fieldErrors = error instanceof ApiError ? error.fieldErrors : [];
  for (const { field, constraints } of fieldErrors) {
    if ((fields as readonly string[]).includes(field)) {
      setError(field as Path<T>, {
        type: 'server',
        message: constraintMessage(constraints, extraConstraints),
      });
    }
  }
  setError('root.server', { type: 'server', message: errorMessage(error, t) });
}
