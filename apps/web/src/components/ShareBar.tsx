import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { formatPercent } from '../lib/format';

/** A ratio (0 to 1) as a bar with its percentage, e.g. a skill frequency. */
export function ShareBar({ ratio, label }: { ratio: number; label: string }) {
  const { i18n } = useTranslation();
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Box sx={{ flexGrow: 1 }}>
        <LinearProgress variant="determinate" value={ratio * 100} aria-label={label} />
      </Box>
      <Typography variant="caption" sx={{ minWidth: 48, textAlign: 'right' }}>
        {formatPercent(ratio, i18n.language)}
      </Typography>
    </Stack>
  );
}
