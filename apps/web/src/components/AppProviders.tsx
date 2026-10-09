import { CssBaseline, ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'dayjs/locale/en';
import 'dayjs/locale/es';
import 'dayjs/locale/fr';
import { type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createQueryClient } from '../api/query-client';
import { FollowUpActionsProvider } from '../features/applications/FollowUpActionsProvider';
import { AuthProvider } from '../features/auth/AuthContext';
import { toLanguage } from '../i18n';
import { NotificationProvider } from './NotificationProvider';
import { createAppTheme } from '../theme';

export function AppProviders({
  children,
  queryClient: providedClient,
}: {
  children: ReactNode;
  queryClient?: QueryClient;
}) {
  const { i18n } = useTranslation();
  const [queryClient] = useState(() => providedClient ?? createQueryClient());
  const language = toLanguage(i18n.resolvedLanguage);
  const theme = useMemo(() => createAppTheme(language), [language]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={language}>
          <AuthProvider>
            <NotificationProvider>
              <FollowUpActionsProvider>{children}</FollowUpActionsProvider>
            </NotificationProvider>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
