import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Stack, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../../lib/format';

/** Follow-up date, highlighted with a warning when it is past. */
export function FollowUpCell({ date, overdue }: { date: string | null; overdue: boolean }) {
  const { t, i18n } = useTranslation();
  if (!date) return <>—</>;
  const formatted = formatDate(date, i18n.language);
  if (!overdue) return <>{formatted}</>;
  return (
    <Tooltip title={t('applications.overdueSince', { date: formatted })}>
      <Stack direction="row" spacing={0.5} sx={{ color: 'error.main', alignItems: 'center' }}>
        <WarningAmberIcon fontSize="small" aria-hidden />
        <span>{formatted}</span>
      </Stack>
    </Tooltip>
  );
}
