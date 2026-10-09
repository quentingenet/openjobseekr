import { Chip } from '@mui/material';
import { followUpRank } from '@openjobseekr/domain';
import { useTranslation } from 'react-i18next';

/** "2nd follow-up", "3rd follow-up"...: where the user stands. Nothing before a first one. */
export function FollowUpRankChip({ followUpCount }: { followUpCount: number }) {
  const { t } = useTranslation();
  const rank = followUpRank(followUpCount);
  if (rank === null) return null;
  return (
    <Chip
      size="small"
      variant="outlined"
      label={t('applications.followUpRank', { rank })}
      sx={{ height: 20, fontSize: '0.75rem', fontWeight: 600 }}
    />
  );
}
