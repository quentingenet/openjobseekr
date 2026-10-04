import LogoutIcon from '@mui/icons-material/Logout';
import WorkOutlineIcon from '@mui/icons-material/WorkOutlined';
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router';
import { useAuth } from '../features/auth/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';

const navLinkSx = {
  color: 'inherit',
  '&.active': { bgcolor: 'rgba(255,255,255,0.18)' },
} as const;

export function AppLayout() {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          <WorkOutlineIcon aria-hidden />
          <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
            {t('app.title')}
          </Typography>
          <Stack
            component="nav"
            aria-label={t('nav.mainNavigation')}
            direction="row"
            spacing={1}
            sx={{ flexGrow: 1 }}
          >
            <Button component={NavLink} to="/applications" sx={navLinkSx}>
              {t('nav.applications')}
            </Button>
            <Button component={NavLink} to="/stats" sx={navLinkSx}>
              {t('nav.stats')}
            </Button>
            <Button component={NavLink} to="/skills" sx={navLinkSx}>
              {t('nav.skills')}
            </Button>
          </Stack>
          <LanguageSwitcher />
          <Tooltip title={t('nav.logout')}>
            <IconButton color="inherit" aria-label={t('nav.logout')} onClick={signOut}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth={false} sx={{ py: 4, width: { xs: '100%', md: '80%' } }}>
        <Outlet />
      </Container>
    </Box>
  );
}
