import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  APPLICATION_CHANNELS,
  APPLICATION_STATUSES,
  type ApplicationTextField as LimitedField,
  computeFollowUpDate,
  isCalendarDate,
  TEXT_LIMITS,
  WORK_MODES,
} from '@openjobseekr/domain';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FormErrorAlert } from '../../components/FormErrorAlert';
import { UnsavedChangesGuard } from '../../components/UnsavedChangesGuard';
import { translateFieldError } from '../../lib/field-error';
import { formatDate } from '../../lib/format';
import { applyServerErrors } from '../../lib/server-errors';
import {
  type ApplicationFormField,
  type ApplicationFormValues,
  applicationFormSchema,
} from './application-form.schema';

export type ApplicationFormOutput = ReturnType<typeof applicationFormSchema.parse>;

const FORM_FIELDS = Object.keys(applicationFormSchema.shape) as ApplicationFormField[];

interface ApplicationFormProps {
  defaultValues: ApplicationFormValues;
  /** Throws an ApiError to show server-side errors in the form. */
  onSubmit: (
    values: ApplicationFormOutput,
    dirtyFields: Partial<Record<ApplicationFormField, unknown>>,
  ) => Promise<void>;
  onCancel: () => void;
  /** From GET /settings; the preview is hidden until it is known. */
  followUpDelayDays?: number;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper component="section" sx={{ p: 3 }}>
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Grid container spacing={2}>
        {children}
      </Grid>
    </Paper>
  );
}

export function ApplicationForm({
  defaultValues,
  onSubmit,
  onCancel,
  followUpDelayDays,
}: ApplicationFormProps) {
  const { t, i18n } = useTranslation();
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitting, isSubmitSuccessful, dirtyFields },
  } = useForm<ApplicationFormValues, unknown, ApplicationFormOutput>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues,
    // Validate a field when leaving it, then live once it has an error.
    mode: 'onTouched',
  });

  /** Plain text field: `register` keeps it uncontrolled (no re-render on each key stroke). */
  const textField = (
    name: LimitedField,
    options: { required?: boolean; multiline?: boolean; rows?: number; autoComplete?: string } = {},
  ) => (
    <TextField
      {...register(name)}
      label={t(`form.fields.${name}`)}
      required={options.required}
      multiline={options.multiline}
      minRows={options.rows}
      autoComplete={options.autoComplete ?? 'off'}
      error={Boolean(errors[name])}
      helperText={translateFieldError(t, errors[name], TEXT_LIMITS[name])}
      slotProps={{ htmlInput: { maxLength: TEXT_LIMITS[name] } }}
    />
  );

  /**
   * Select field: MUI selects are controlled, so they go through `Controller`. The ref goes to
   * the hidden input so React Hook Form can focus the field on error.
   */
  const selectField = (
    name: 'status' | 'channel' | 'workMode',
    values: readonly string[],
    labelPrefix: 'status' | 'channel' | 'workMode',
    options: { required?: boolean } = {},
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field: { ref, ...field }, fieldState }) => (
        <TextField
          {...field}
          inputRef={ref}
          select
          required={options.required}
          label={t(`form.fields.${name}`)}
          error={Boolean(fieldState.error)}
          helperText={translateFieldError(t, fieldState.error)}
        >
          {!options.required && (
            <MenuItem value="">
              <em>{t('form.notSpecified')}</em>
            </MenuItem>
          )}
          {values.map((value) => (
            <MenuItem key={value} value={value}>
              {t(`${labelPrefix}.${value}` as 'status.SENT')}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );

  // Live preview of the follow-up date, like the spreadsheet column.
  const [sentAt, status, channel] = useWatch({ control, name: ['sentAt', 'status', 'channel'] });
  const followUpDate =
    followUpDelayDays === undefined || !isCalendarDate(sentAt)
      ? undefined
      : computeFollowUpDate(sentAt, status, followUpDelayDays);
  const followUpPreview =
    followUpDate === undefined
      ? null
      : followUpDate === null
        ? t('form.noFollowUp')
        : t('form.followUpPreview', { date: formatDate(followUpDate, i18n.language) });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values, dirtyFields);
    } catch (error) {
      applyServerErrors(error, setError, FORM_FIELDS, t);
    }
  });

  return (
    <Box component="form" noValidate onSubmit={submit}>
      <Stack spacing={3}>
        <FormErrorAlert error={errors.root?.server} />

        <Section title={t('form.sections.offer')}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              control={control}
              name="sentAt"
              render={({ field, fieldState }) => (
                <DatePicker
                  label={t('form.fields.sentAt')}
                  value={isCalendarDate(field.value) ? dayjs(field.value) : null}
                  onChange={(date) =>
                    field.onChange(date?.isValid() ? date.format('YYYY-MM-DD') : '')
                  }
                  inputRef={field.ref}
                  slotProps={{
                    textField: {
                      name: field.name,
                      required: true,
                      fullWidth: true,
                      onBlur: field.onBlur,
                      error: Boolean(fieldState.error),
                      helperText: translateFieldError(t, fieldState.error),
                    },
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            {textField('company', { required: true, autoComplete: 'organization' })}
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>{textField('jobTitle', { required: true })}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>{textField('location')}</Grid>
        </Section>

        <Section title={t('form.sections.tracking')}>
          <Grid size={{ xs: 12, md: 4 }}>
            {selectField('status', APPLICATION_STATUSES, 'status', { required: true })}
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            {selectField('channel', APPLICATION_CHANNELS, 'channel')}
          </Grid>
          {channel === 'OTHER' && (
            <Grid size={{ xs: 12, md: 4 }}>{textField('channelDetail')}</Grid>
          )}
          <Grid size={{ xs: 12, md: 4 }}>{textField('contact')}</Grid>
          {followUpPreview && (
            <Grid size={12}>
              <Alert severity={status === 'SENT' ? 'info' : 'success'} role="status">
                {followUpPreview}
              </Alert>
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 6 }}>
            {textField('response', { multiline: true, rows: 2 })}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            {textField('resources', { multiline: true, rows: 2 })}
          </Grid>
        </Section>

        <Section title={t('form.sections.conditions')}>
          <Grid size={{ xs: 12, md: 4 }}>{selectField('workMode', WORK_MODES, 'workMode')}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>{textField('remoteRhythm')}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>{textField('salaryRange')}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>{textField('cvVersion')}</Grid>
          <Grid size={{ xs: 12, md: 8 }}>{textField('stack')}</Grid>
        </Section>

        <Section title={t('form.sections.posting')}>
          <Grid size={12}>{textField('jobPostingText', { multiline: true, rows: 8 })}</Grid>
        </Section>

        <Section title={t('form.sections.notes')}>
          <Grid size={12}>{textField('recruitmentProcess', { multiline: true, rows: 3 })}</Grid>
          <Grid size={12}>{textField('notes', { multiline: true, rows: 3 })}</Grid>
        </Section>

        <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} disabled={isSubmitting}>
            {t('form.cancel')}
          </Button>
          <Button type="submit" variant="contained" size="large" loading={isSubmitting}>
            {t('form.save')}
          </Button>
        </Stack>
      </Stack>

      <UnsavedChangesGuard active={isDirty && !isSubmitting && !isSubmitSuccessful} />
    </Box>
  );
}
