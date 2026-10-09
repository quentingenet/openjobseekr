import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import WorkOutlineIcon from '@mui/icons-material/WorkOutlined';
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router';
import { useAuth } from '../features/auth/AuthContext';
import { useIsMobile } from '../lib/useIsMobile';
import { LanguageSwitcher } from './LanguageSwitcher';

const NAV_ITEMS = [
  { to: '/applications', labelKey: 'nav.applications' },
  { to: '/stats', labelKey: 'nav.stats' },
  { to: '/skills', labelKey: 'nav.skills' },
] as const;

const navLinkSx = {
  color: 'inherit',
  '&.active': { bgcolor: 'rgba(255,255,255,0.18)' },
} as const;

/** Phones: the navigation, the language and the logout move into a side drawer. */
function MobileMenu({ onSignOut }: { onSignOut: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <IconButton
        color="inherit"
        edge="end"
        aria-label={t('nav.openMenu')}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </IconButton>
      <Drawer
        anchor="right"
        open={open}
        onClose={close}
        slotProps={{ paper: { sx: { width: 280, borderRadius: 0 } } }}
      >
        <List component="nav" aria-label={t('nav.mainNavigation')} sx={{ pt: 2 }}>
          {NAV_ITEMS.map(({ to, labelKey }) => (
            <ListItemButton
              key={to}
              component={NavLink}
              to={to}
              onClick={close}
              sx={{
                mx: 1,
                borderRadius: 2,
                '&.active': { bgcolor: 'action.selected', color: 'primary.main' },
              }}
            >
              <ListItemText
                primary={t(labelKey)}
                slotProps={{ primary: { sx: { fontWeight: 600 } } }}
              />
            </ListItemButton>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 2 }}>
          <LanguageSwitcher />
        </Box>
        <Divider />
        <List>
          <ListItemButton
            onClick={() => {
              close();
              onSignOut();
            }}
            sx={{ mx: 1, borderRadius: 2 }}
          >
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary={t('nav.logout')} />
          </ListItemButton>
        </List>
      </Drawer>
    </>
  );
}

export function AppLayout() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const isMobile = useIsMobile();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          <WorkOutlineIcon aria-hidden />
          <Typography
            variant="h6"
            component="span"
            sx={{ fontWeight: 700, flexGrow: { xs: 1, md: 0 } }}
          >
            {t('app.title')}
          </Typography>
          {isMobile ? (
            <MobileMenu onSignOut={signOut} />
          ) : (
            <>
              <Stack
                component="nav"
                aria-label={t('nav.mainNavigation')}
                direction="row"
                spacing={1}
                sx={{ flexGrow: 1 }}
              >
                {NAV_ITEMS.map(({ to, labelKey }) => (
                  <Button key={to} component={NavLink} to={to} sx={navLinkSx}>
                    {t(labelKey)}
                  </Button>
                ))}
              </Stack>
              <LanguageSwitcher />
              <Tooltip title={t('nav.logout')}>
                <IconButton color="inherit" aria-label={t('nav.logout')} onClick={signOut}>
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Toolbar>
      </AppBar>
      {/* The full width for wide tables, with gutters; capped (1536 px) so that lines do not
          stretch on very large screens. */}
      <Container
        component="main"
        maxWidth="xl"
        sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, sm: 3, lg: 4 } }}
      >
        <Outlet />
      </Container>
    </Box>
  );
}
