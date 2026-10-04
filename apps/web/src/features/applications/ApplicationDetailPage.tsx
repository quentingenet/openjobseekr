import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router';
import { useApplication, useDeleteApplication } from '../../api/hooks';
import type { Application, ApplicationStatus } from '../../api/types';
import { ErrorState, LoadingState } from '../../components/PageStates';
import { errorMessage } from '../../lib/errors';
import { formatDate, formatDateTime } from '../../lib/format';
import { StatusChip } from './StatusChip';

type DetailField = Exclude<
  keyof Application,
  | 'id'
  | 'company'
  | 'jobTitle'
  | 'status'
  | 'followUpDate'
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
    if (field === 'channel') return t(`channel.${data.channel ?? 'UNSPECIFIED'}`);
    if (field === 'workMode') return t(`workMode.${data.workMode ?? 'UNSPECIFIED'}`);
    return value;
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Button component={RouterLink} to="/applications" startIcon={<ArrowBackIcon />}>
          {t('detail.back')}
        </Button>
      </Box>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h4" component="h1">
            {data.company}
          </Typography>
          <Typography variant="h6" component="p" color="text.secondary">
            {data.jobTitle}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusChip status={data.status as ApplicationStatus} />
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
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
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
        {/* Rendered as plain text: React escapes it, no HTML is ever injected. */}
        <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          {data.jobPostingText || t('detail.noPostingText')}
        </Typography>
      </Paper>

      <Typography variant="caption" color="text.secondary">
        {t('detail.createdAt', { date: formatDateTime(data.createdAt, language) })} ·{' '}
        {t('detail.updatedAt', { date: formatDateTime(data.updatedAt, language) })}
      </Typography>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{t('detail.deleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('detail.deleteMessage', { company: data.company })}
          </DialogContentText>
          {remove.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorMessage(remove.error, t)}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} autoFocus>
            {t('detail.cancel')}
          </Button>
          <Button
            color="error"
            variant="contained"
            loading={remove.isPending}
            onClick={() =>
              remove.mutate(id, {
                onSuccess: () => void navigate('/applications', { replace: true }),
              })
            }
          >
            {t('detail.confirmDelete')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={savedNotice}
        autoHideDuration={4000}
        onClose={() => setSavedNotice(false)}
        message={t('form.saved')}
      />
    </Stack>
  );
}
