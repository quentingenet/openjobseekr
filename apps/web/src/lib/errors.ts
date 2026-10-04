import type { TFunction } from 'i18next';
import { ApiError } from '../api/client';

/** User-facing message for any error: API codes are translated with `errors.<CODE>`. */
export function errorMessage(error: unknown, t: TFunction): string {
  const code = error instanceof ApiError ? error.code : 'UNKNOWN';
  return t(`errors.${code}`, { defaultValue: t('errors.UNKNOWN') });
}
