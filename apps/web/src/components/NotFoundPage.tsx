import { Button, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import { PageTitle } from './PageTitle';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <Stack spacing={2} sx={{ alignItems: 'center', py: 8 }}>
      <PageTitle fallback="/applications">{t('common.pageNotFound')}</PageTitle>
      <Button component={RouterLink} to="/applications" variant="contained">
        {t('common.goHome')}
      </Button>
    </Stack>
  );
}
