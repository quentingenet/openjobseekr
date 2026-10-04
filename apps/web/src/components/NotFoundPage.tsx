import { Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <Stack spacing={2} sx={{ alignItems: 'center', py: 8 }}>
      <Typography variant="h4" component="h1">
        {t('common.pageNotFound')}
      </Typography>
      <Button component={RouterLink} to="/applications" variant="contained">
        {t('common.goHome')}
      </Button>
    </Stack>
  );
}
