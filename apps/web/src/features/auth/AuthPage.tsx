import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Container,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import { useLogin, useRegister } from '../../api/hooks';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { errorMessage } from '../../lib/errors';
import { translateFieldError } from '../../lib/field-error';
import { type CredentialsForm, credentialsSchema } from './auth.schema';
import { useAuth } from './AuthContext';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const login = useLogin();
  const register = useRegister();
  const mutation = mode === 'login' ? login : register;

  const form = useForm<CredentialsForm>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (credentials) => {
    try {
      const { accessToken } = await mutation.mutateAsync(credentials);
      // `RedirectIfAuthenticated` then opens the page that was requested before logging in.
      signIn(accessToken);
    } catch {
      // The error is displayed from `mutation.error`.
    }
  });

  const title = mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 8 }}>
      <Container maxWidth="xs">
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
        >
          <Typography variant="h5" component="p" sx={{ fontWeight: 700 }}>
            {t('app.title')}
          </Typography>
          <LanguageSwitcher />
        </Stack>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            {title}
          </Typography>
          <Box component="form" noValidate onSubmit={onSubmit}>
            <Stack spacing={2}>
              {mutation.isError && (
                <Alert severity="error">{errorMessage(mutation.error, t)}</Alert>
              )}
              <TextField
                {...form.register('email')}
                label={t('auth.email')}
                type="email"
                autoComplete="email"
                autoFocus
                required
                error={Boolean(errors.email)}
                helperText={translateFieldError(t, errors.email)}
              />
              <TextField
                {...form.register('password')}
                label={t('auth.password')}
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                error={Boolean(errors.password)}
                helperText={
                  translateFieldError(t, errors.password) ??
                  (mode === 'register' ? t('auth.passwordHelp') : undefined)
                }
              />
              <Button type="submit" variant="contained" size="large" loading={isSubmitting}>
                {mode === 'login' ? t('auth.submitLogin') : t('auth.submitRegister')}
              </Button>
              <Link
                component={RouterLink}
                to={mode === 'login' ? '/register' : '/login'}
                sx={{ textAlign: 'center' }}
              >
                {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
              </Link>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
