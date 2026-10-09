import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Stack, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { ApplicationSummary } from '../../../api/types';
import { formatDate } from '../../../lib/format';
import { FollowUpRankChip } from '../FollowUpRankChip';

type FollowUp = Pick<ApplicationSummary, 'followUpDate' | 'followUpOverdue' | 'followUpCount'>;

/**
 * Follow-up date, highlighted with a warning when it is past, and its rank after a first one,
 * below the date to keep the column narrow.
 */
export function FollowUpCell({ application }: { application: FollowUp }) {
  const { t, i18n } = useTranslation();
  const { followUpDate, followUpOverdue, followUpCount } = application;
  if (!followUpDate) return <>—</>;
  const formatted = formatDate(followUpDate, i18n.language);
  const date = followUpOverdue ? (
    <Tooltip title={t('applications.overdueSince', { date: formatted })}>
      <Stack direction="row" spacing={0.5} sx={{ color: 'error.main', alignItems: 'center' }}>
        <WarningAmberIcon fontSize="small" aria-hidden />
        <span>{formatted}</span>
      </Stack>
    </Tooltip>
  ) : (
    <span>{formatted}</span>
  );
  return (
    <Stack spacing={0.5} component="span" sx={{ alignItems: 'flex-start' }}>
      {date}
      <FollowUpRankChip followUpCount={followUpCount} />
    </Stack>
  );
}
