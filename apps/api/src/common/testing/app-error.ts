import { AppException } from '../app.exception.js';

/** Code, status, detail and invalid fields of an AppException, for explicit assertions. */
export function appError(error: unknown) {
  if (!(error instanceof AppException))
    throw new Error(`Expected an AppException, got ${String(error)}`);
  return {
    code: error.code,
    status: error.getStatus(),
    detail: error.detail,
    errors: error.errors,
  };
}
