import { Alert, Button, Snackbar } from '@mui/material';
import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from 'react';

export interface Notification {
  message: string;
  severity?: 'info' | 'error';
  /** A button in the notification, e.g. to undo what was just done. */
  action?: { label: string; onClick: () => void };
  /** How long it stays on screen, e.g. as long as an undo is possible. */
  durationMs?: number;
}

type Notify = (notification: Notification) => void;

const NotifyContext = createContext<Notify | null>(null);

const DEFAULT_DURATION_MS = 6000;

/**
 * One snackbar for the whole app. It outlives the component that triggered it: an undo stays
 * available even when the changed item leaves a filtered list.
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  // The key restarts the snackbar (and its timer) when a new notification replaces one.
  const [current, setCurrent] = useState<(Notification & { key: number }) | null>(null);
  const nextKey = useRef(0);
  const notify = useCallback<Notify>((notification) => {
    nextKey.current += 1;
    setCurrent({ ...notification, key: nextKey.current });
  }, []);
  const close = () => setCurrent(null);

  const action = current?.action && (
    <Button
      color="inherit"
      size="small"
      onClick={() => {
        close();
        current.action?.onClick();
      }}
    >
      {current.action.label}
    </Button>
  );

  return (
    <NotifyContext.Provider value={notify}>
      {children}
      {current && (
        <Snackbar
          key={current.key}
          open
          autoHideDuration={current.durationMs ?? DEFAULT_DURATION_MS}
          onClose={(_, reason) => {
            // A click elsewhere must not hide an undo button before the user can reach it.
            if (reason !== 'clickaway') close();
          }}
          message={current.message}
          action={action}
        >
          {current.severity === 'error' ? (
            <Alert severity="error" onClose={close}>
              {current.message}
            </Alert>
          ) : undefined}
        </Snackbar>
      )}
    </NotifyContext.Provider>
  );
}

export function useNotify(): Notify {
  const notify = useContext(NotifyContext);
  if (!notify) throw new Error('useNotify must be used inside NotificationProvider');
  return notify;
}
