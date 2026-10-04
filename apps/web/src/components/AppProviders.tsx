import { CssBaseline, ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'dayjs/locale/en';
import 'dayjs/locale/fr';
import { type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createQueryClient } from '../api/query-client';
import { AuthProvider } from '../features/auth/AuthContext';
import type { Language } from '../i18n';
import { createAppTheme } from '../theme';

/** Theme, date pickers, server state and session, all following the active language. */
export function AppProviders({
  children,
  queryClient: providedClient,
}: {
  children: ReactNode;
  queryClient?: QueryClient;
}) {
  const { i18n } = useTranslation();
  const [queryClient] = useState(() => providedClient ?? createQueryClient());
  const language: Language = i18n.resolvedLanguage === 'fr' ? 'fr' : 'en';
  const theme = useMemo(() => createAppTheme(language), [language]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={language}>
          <AuthProvider>{children}</AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
