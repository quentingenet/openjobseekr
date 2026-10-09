import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useRecordFollowUp, useRestoreFollowUp } from '../../api/queries/applications';
import type { ApplicationSummary } from '../../api/types';
import { useNotify } from '../../components/NotificationProvider';
import { errorMessage } from '../../lib/errors';
import { formatDate } from '../../lib/format';

/** How long a recorded follow-up can be undone, from its button or its notification. */
export const UNDO_WINDOW_MS = 10_000;

type FollowUpBefore = Pick<ApplicationSummary, 'id' | 'followUpOverride' | 'followUpCount'>;

/** Where a follow-up action stands for one application; none when idle. */
export type FollowUpActionState =
  { status: 'recording' } | { status: 'undoable'; expiresAt: number } | { status: 'undoing' };

interface FollowUpActions {
  stateOf: (id: string) => FollowUpActionState | undefined;
  record: (application: FollowUpBefore) => void;
  undo: (id: string) => void;
}

const FollowUpActionsContext = createContext<FollowUpActions | null>(null);

/**
 * Records follow-ups and keeps them undoable for `UNDO_WINDOW_MS`. The state lives here, not in
 * a button: a list reload (the application is no longer due) or leaving a filtered list must
 * not lose the undo.
 */
export function FollowUpActionsProvider({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const notify = useNotify();
  // `mutateAsync` is stable, and its promise settles even when the caller is gone.
  const { mutateAsync: recordFollowUp } = useRecordFollowUp();
  const { mutateAsync: restoreFollowUp } = useRestoreFollowUp();
  const [states, setStates] = useState<ReadonlyMap<string, FollowUpActionState>>(new Map());
  // Values before each undoable follow-up, and the timers that end the undo windows.
  const before = useRef(new Map<string, FollowUpBefore>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const setState = useCallback((id: string, state: FollowUpActionState | undefined) => {
    setStates((previous) => {
      const next = new Map(previous);
      if (state) next.set(id, state);
      else next.delete(id);
      return next;
    });
  }, []);

  const forget = useCallback(
    (id: string) => {
      clearTimeout(timers.current.get(id));
      timers.current.delete(id);
      before.current.delete(id);
      setState(id, undefined);
    },
    [setState],
  );

  const notifyError = useCallback(
    (error: unknown) => {
      notify({ message: errorMessage(error, t), severity: 'error' });
    },
    [notify, t],
  );

  const undo = useCallback(
    (id: string) => {
      const previous = before.current.get(id);
      // Undone once only: from the button or the notification, whichever comes first.
      if (!previous) return;
      before.current.delete(id);
      clearTimeout(timers.current.get(id));
      setState(id, { status: 'undoing' });
      restoreFollowUp(previous)
        .catch(notifyError)
        .finally(() => forget(id));
    },
    [forget, notifyError, restoreFollowUp, setState],
  );

  const record = useCallback(
    ({ id, followUpOverride, followUpCount }: FollowUpBefore) => {
      setState(id, { status: 'recording' });
      recordFollowUp(id)
        .then((updated) => {
          // Only what the undo puts back: the caller may pass a whole application.
          before.current.set(id, { id, followUpOverride, followUpCount });
          setState(id, { status: 'undoable', expiresAt: Date.now() + UNDO_WINDOW_MS });
          timers.current.set(
            id,
            setTimeout(() => forget(id), UNDO_WINDOW_MS),
          );
          notify({
            message: t('applications.followUpRecorded', {
              date: updated.followUpDate && formatDate(updated.followUpDate, i18n.language),
            }),
            action: { label: t('common.undo'), onClick: () => undo(id) },
            durationMs: UNDO_WINDOW_MS,
          });
        })
        .catch((error: unknown) => {
          forget(id);
          notifyError(error);
        });
    },
    [forget, i18n.language, notify, notifyError, recordFollowUp, setState, t, undo],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
    };
  }, []);

  const stateOf = useCallback((id: string) => states.get(id), [states]);

  return (
    <FollowUpActionsContext.Provider value={{ stateOf, record, undo }}>
      {children}
    </FollowUpActionsContext.Provider>
  );
}

export function useFollowUpActions(): FollowUpActions {
  const actions = useContext(FollowUpActionsContext);
  if (!actions) throw new Error('useFollowUpActions must be used inside FollowUpActionsProvider');
  return actions;
}
