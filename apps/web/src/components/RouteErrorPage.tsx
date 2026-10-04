import { Alert, Button, Container, Stack } from '@mui/material';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useRouteError } from 'react-router';

/** Shown instead of a blank screen when a page crashes while rendering. */
export function RouteErrorPage() {
  const { t } = useTranslation();
  const error = useRouteError();
  useEffect(() => console.error(error), [error]);
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Stack spacing={2}>
        <Alert severity="error">{t('common.unexpectedError')}</Alert>
        <Button component={RouterLink} to="/applications" variant="contained" reloadDocument>
          {t('common.goHome')}
        </Button>
      </Stack>
    </Container>
  );
}
