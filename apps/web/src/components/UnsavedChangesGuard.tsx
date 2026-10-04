import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useBlocker } from 'react-router';

/**
 * While `active`, asks before leaving the page: a dialog for in-app navigation (needs a data
 * router) and the browser prompt when closing or reloading the tab.
 */
export function UnsavedChangesGuard({ active }: { active: boolean }) {
  const { t } = useTranslation();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      active && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!active) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [active]);

  return (
    <Dialog open={blocker.state === 'blocked'} onClose={() => blocker.reset?.()}>
      <DialogTitle>{t('form.unsavedTitle')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('form.unsavedMessage')}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => blocker.reset?.()} autoFocus>
          {t('form.stay')}
        </Button>
        <Button color="error" onClick={() => blocker.proceed?.()}>
          {t('form.leave')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
