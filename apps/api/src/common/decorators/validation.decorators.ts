import { ValidateBy, ValidateIf, type ValidationOptions } from 'class-validator';
import { isCalendarDate } from '../../applications/domain/calendar-date.js';

/** A real calendar date written `YYYY-MM-DD` (rejects 2026-02-30). */
export function IsCalendarDate(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isCalendarDate',
      validator: {
        validate: (value: unknown) => typeof value === 'string' && isCalendarDate(value),
        defaultMessage: () => '$property must be a date formatted as YYYY-MM-DD',
      },
    },
    options,
  );
}

/** Optional, but `null` is rejected: for fields that cannot be cleared. */
export function IsOptionalNotNull(): PropertyDecorator {
  return ValidateIf((_object, value) => value !== undefined);
}
