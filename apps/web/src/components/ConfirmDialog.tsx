import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { errorMessage } from '../lib/errors';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** While the confirmed action runs. */
  loading?: boolean;
  /** Error of the confirmed action, shown translated. */
  error?: unknown;
}

/** Confirmation of a destructive action; the safe choice (cancel) has the focus. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  loading = false,
  error,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
        {error != null && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMessage(error, t)}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} autoFocus>
          {t('common.cancel')}
        </Button>
        <Button color="error" variant="contained" loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
