import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, Button, Chip, Grid, Paper, Snackbar, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router';
import { useApplication, useDeleteApplication } from '../../api/queries/applications';
import type { Application } from '../../api/types';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ErrorState, LoadingState } from '../../components/PageStates';
import { formatDate, formatDateTime } from '../../lib/format';
import { channelLabel } from './channel-label';
import { StatusChip } from './StatusChip';
import { PageTitle } from '../../components/PageTitle';

type DetailField = Exclude<
  keyof Application,
  | 'id'
  | 'channelDetail'
  | 'company'
  | 'jobTitle'
  | 'status'
  | 'followUpDate'
  | 'followUpOverride'
  | 'followUpOverdue'
  | 'jobPostingText'
  | 'createdAt'
  | 'updatedAt'
>;

const DETAIL_FIELDS: DetailField[] = [
  'sentAt',
  'location',
  'channel',
  'contact',
  'workMode',
  'remoteRhythm',
  'salaryRange',
  'cvVersion',
  'stack',
  'response',
  'resources',
  'recruitmentProcess',
  'notes',
];

export function ApplicationDetailPage() {
  const { id = '' } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const application = useApplication(id);
  const remove = useDeleteApplication();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [savedNotice, setSavedNotice] = useState(
    Boolean((location.state as { saved?: boolean } | null)?.saved),
  );
  // Consume the "saved" flag so the notice is not shown again on reload or back/forward.
  useEffect(() => {
    if ((location.state as { saved?: boolean } | null)?.saved) {
      void navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  if (application.isPending) return <LoadingState />;
  if (application.error) return <ErrorState error={application.error} />;

  const data = application.data;
  const language = i18n.language;

  const display = (field: DetailField): string => {
    const value = data[field];
    if (value === null || value === '') return '—';
    if (field === 'sentAt') return formatDate(value, language);
    if (field === 'channel') return channelLabel(t, data.channel, data.channelDetail) ?? '—';
    if (field === 'workMode') return t(`workMode.${data.workMode ?? 'UNSPECIFIED'}`);
    return value;
  };

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between' }}
      >
        <Box>
          <PageTitle fallback="/applications">{data.company}</PageTitle>
          <Typography variant="h6" component="p" color="text.secondary">
            {data.jobTitle}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusChip status={data.status} />
            {data.followUpDate && (
              <Chip
                size="small"
                variant="outlined"
                color={data.followUpOverdue ? 'error' : 'default'}
                icon={data.followUpOverdue ? <WarningAmberIcon /> : undefined}
                label={t(data.followUpOverdue ? 'detail.followUpOverdue' : 'detail.followUpOn', {
                  date: formatDate(data.followUpDate, language),
                })}
              />
            )}
          </Stack>
        </Box>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'flex-start', '& > *': { flex: { xs: 1, md: 'none' } } }}
        >
          <Button
            component={RouterLink}
            to={`/applications/${id}/edit`}
            variant="contained"
            startIcon={<EditIcon />}
          >
            {t('detail.edit')}
          </Button>
          <Button
            color="error"
            variant="outlined"
            startIcon={<DeleteOutlineIcon />}
            onClick={() => setConfirmOpen(true)}
          >
            {t('detail.delete')}
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2} component="dl" sx={{ m: 0 }}>
          {DETAIL_FIELDS.map((field) => (
            <Grid key={field} size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography component="dt" variant="caption" color="text.secondary">
                {t(`form.fields.${field}`)}
              </Typography>
              <Typography
                component="dd"
                sx={{ m: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
              >
                {display(field)}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          {t('form.fields.jobPostingText')}
        </Typography>
        <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          {data.jobPostingText || t('detail.noPostingText')}
        </Typography>
      </Paper>

      <Typography variant="caption" color="text.secondary">
        {t('detail.createdAt', { date: formatDateTime(data.createdAt, language) })} ·{' '}
        {t('detail.updatedAt', { date: formatDateTime(data.updatedAt, language) })}
      </Typography>

      <ConfirmDialog
        open={confirmOpen}
        title={t('detail.deleteTitle')}
        message={t('detail.deleteMessage', { company: data.company })}
        confirmLabel={t('detail.confirmDelete')}
        loading={remove.isPending}
        error={remove.error}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() =>
          remove.mutate(id, { onSuccess: () => void navigate('/applications', { replace: true }) })
        }
      />

      <Snackbar
        open={savedNotice}
        autoHideDuration={4000}
        onClose={() => setSavedNotice(false)}
        message={t('form.saved')}
      />
    </Stack>
  );
}
