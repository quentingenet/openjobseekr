import {
  Box,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useStatsOverview } from '../../api/hooks';
import { APPLICATION_CHANNELS, APPLICATION_STATUSES } from '../../api/types';
import { ErrorState, LoadingState } from '../../components/PageStates';
import { formatNumber, formatPercent } from '../../lib/format';

function KeyFigure({ label, value }: { label: string; value: string }) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography variant="h3" component="p" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
    </Paper>
  );
}

function BreakdownTable({
  title,
  rows,
  total,
}: {
  title: string;
  rows: { key: string; label: string; count: number }[];
  total: number;
}) {
  const { t, i18n } = useTranslation();
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" component="h2" gutterBottom>
        {title}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{title}</TableCell>
            <TableCell align="right">{t('stats.count')}</TableCell>
            <TableCell sx={{ width: '40%' }}>{t('stats.share')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(({ key, label, count }) => {
            const share = total > 0 ? count / total : 0;
            return (
              <TableRow key={key}>
                <TableCell>{label}</TableCell>
                <TableCell align="right">{formatNumber(count, i18n.language)}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={share * 100}
                        aria-label={label}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ minWidth: 48, textAlign: 'right' }}>
                      {formatPercent(share, i18n.language)}
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
}

export function StatsPage() {
  const { t, i18n } = useTranslation();
  const { data, error, isPending, refetch } = useStatsOverview();

  if (isPending) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const language = i18n.language;
  const statusRows = APPLICATION_STATUSES.map((status) => ({
    key: status,
    label: t(`status.${status}`),
    count: data.byStatus[status] ?? 0,
  }));
  const channelRows = [...APPLICATION_CHANNELS, 'UNSPECIFIED' as const]
    .map((channel) => ({
      key: channel,
      label: t(`channel.${channel}`),
      count: data.byChannel[channel] ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h1">
        {t('stats.title')}
      </Typography>
      {data.total === 0 && <Typography color="text.secondary">{t('stats.empty')}</Typography>}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <KeyFigure label={t('stats.total')} value={formatNumber(data.total, language)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <KeyFigure
            label={t('stats.responseRate')}
            value={
              data.responseRate === null
                ? t('stats.noRate')
                : formatPercent(data.responseRate, language)
            }
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <BreakdownTable title={t('stats.byStatus')} rows={statusRows} total={data.total} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <BreakdownTable title={t('stats.byChannel')} rows={channelRows} total={data.total} />
        </Grid>
      </Grid>
    </Stack>
  );
}
