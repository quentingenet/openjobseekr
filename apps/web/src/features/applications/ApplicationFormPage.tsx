import { Stack } from '@mui/material';
import { toCalendarDate } from '@openjobseekr/domain';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import {
  useApplication,
  useCreateApplication,
  useUpdateApplication,
} from '../../api/queries/applications';
import { useSettings } from '../../api/queries/settings';
import { PageTitle } from '../../components/PageTitle';
import { ErrorState, LoadingState } from '../../components/PageStates';
import {
  applicationToForm,
  emptyApplicationForm,
  toCreateInput,
  toUpdateInput,
} from './application-form.schema';
import { ApplicationForm } from './ApplicationForm';

export function NewApplicationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const create = useCreateApplication();
  const settings = useSettings();

  return (
    <Stack spacing={3}>
      <PageTitle fallback="/applications">{t('form.newTitle')}</PageTitle>
      <ApplicationForm
        defaultValues={emptyApplicationForm(toCalendarDate(new Date()))}
        followUpDelayDays={settings.data?.followUpDelayDays}
        onCancel={() => void navigate('/applications')}
        onSubmit={async (values) => {
          const application = await create.mutateAsync(toCreateInput(values));
          await navigate(`/applications/${application.id}`, { state: { saved: true } });
        }}
      />
    </Stack>
  );
}

export function EditApplicationPage() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const application = useApplication(id);
  const update = useUpdateApplication(id);
  const settings = useSettings();

  if (application.isPending) return <LoadingState />;
  if (application.error) return <ErrorState error={application.error} />;

  return (
    <Stack spacing={3}>
      <PageTitle fallback={`/applications/${id}`}>{t('form.editTitle')}</PageTitle>
      <ApplicationForm
        // Values are loaded once: a background refetch never overwrites what the user typed.
        key={id}
        defaultValues={applicationToForm(application.data)}
        followUpDelayDays={settings.data?.followUpDelayDays}
        onCancel={() => void navigate(`/applications/${id}`)}
        onSubmit={async (values, dirtyFields) => {
          await update.mutateAsync(toUpdateInput(values, dirtyFields));
          await navigate(`/applications/${id}`, { state: { saved: true } });
        }}
      />
    </Stack>
  );
}
