import { Alert } from '@mui/material';
import type { FieldError } from 'react-hook-form';

/** The form-level error set by `applyServerErrors` (`errors.root.server`). */
export function FormErrorAlert({ error }: { error?: Pick<FieldError, 'message'> }) {
  return error?.message ? <Alert severity="error">{error.message}</Alert> : null;
}
