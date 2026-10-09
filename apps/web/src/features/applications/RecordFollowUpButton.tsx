import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import UndoIcon from '@mui/icons-material/Undo';
import { Box, Button, CircularProgress, IconButton, Tooltip } from '@mui/material';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { ApplicationSummary } from '../../api/types';
import { useCountdown } from '../../lib/useCountdown';
import { UNDO_WINDOW_MS, useFollowUpActions } from './FollowUpActionsProvider';

interface RecordFollowUpButtonProps {
  application: Pick<
    ApplicationSummary,
    'id' | 'followUpOverride' | 'followUpCount' | 'followUpOverdue'
  >;
  /** `icon` in lists, where space is short; `button` on the detail page. */
  variant: 'icon' | 'button';
  /** Lists offer it only for a follow-up due (and while the one just recorded can be undone). */
  onlyWhenDue?: boolean;
}

/**
 * "I followed up": the API counts it and schedules the next follow-up one delay later. For
 * `UNDO_WINDOW_MS` the same button undoes it, with a countdown; the notification offers the
 * same undo.
 */
export function RecordFollowUpButton({
  application,
  variant,
  onlyWhenDue = false,
}: RecordFollowUpButtonProps) {
  const { t } = useTranslation();
  const { stateOf, record, undo } = useFollowUpActions();
  const state = stateOf(application.id);
  const left = useCountdown(state?.status === 'undoable' ? state.expiresAt : undefined);

  if (!state && onlyWhenDue && !application.followUpOverdue) return null;

  const undoable = state?.status === 'undoable' || state?.status === 'undoing';
  const busy = state !== undefined && state.status !== 'undoable';
  const label = undoable ? t('applications.undoFollowUp') : t('applications.recordFollowUp');
  const seconds = Math.ceil(left / 1000);

  const handleClick = () => {
    if (undoable) undo(application.id);
    else record(application);
  };

  if (variant === 'button') {
    return (
      <Button
        size="small"
        variant="outlined"
        color={undoable ? 'warning' : 'primary'}
        startIcon={undoable ? <UndoIcon /> : <MarkEmailReadOutlinedIcon />}
        loading={busy}
        onClick={handleClick}
        aria-label={label}
      >
        {undoable ? t('applications.undoCountdown', { seconds }) : label}
      </Button>
    );
  }
  return (
    <Tooltip title={undoable ? t('applications.undoCountdown', { seconds }) : label}>
      {/* The span keeps the tooltip working while the button is disabled, and stops the clicks
          a disabled button lets through (or that land on the ring) from reaching the row. */}
      <Box
        component="span"
        // In a table row, a click must not also open the application.
        onClick={(event: MouseEvent) => event.stopPropagation()}
        sx={{ position: 'relative', display: 'inline-flex' }}
      >
        <IconButton
          size="small"
          color={undoable ? 'warning' : 'default'}
          aria-label={label}
          disabled={busy}
          onClick={handleClick}
        >
          {undoable ? (
            <UndoIcon fontSize="small" />
          ) : (
            <MarkEmailReadOutlinedIcon fontSize="small" />
          )}
        </IconButton>
        {state?.status === 'undoable' && (
          // Time left to undo, as a ring around the button.
          <CircularProgress
            variant="determinate"
            value={(left / UNDO_WINDOW_MS) * 100}
            size={34}
            thickness={2.5}
            color="warning"
            aria-hidden
            sx={{ position: 'absolute', inset: 0, margin: 'auto', pointerEvents: 'none' }}
          />
        )}
      </Box>
    </Tooltip>
  );
}
