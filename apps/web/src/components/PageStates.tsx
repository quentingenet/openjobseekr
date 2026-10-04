import { Alert, Box, Button, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { errorMessage } from '../lib/errors';

export function LoadingState() {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress aria-label={t('common.loading')} />
    </Box>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        ) : undefined
      }
    >
      {errorMessage(error, t)}
    </Alert>
  );
}
