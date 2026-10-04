import type { TFunction } from 'i18next';
import type { FieldError } from 'react-hook-form';

/**
 * Zod schemas use translation keys as messages (e.g. `validation.required`), so messages
 * follow the active language. `max` fills `{{max}}` in `validation.tooLong`.
 */
export function translateFieldError(
  t: TFunction,
  error: FieldError | undefined,
  max?: number,
): string | undefined {
  if (!error?.message) return undefined;
  return t(error.message as 'validation.invalid', { max, defaultValue: t('validation.invalid') });
}
