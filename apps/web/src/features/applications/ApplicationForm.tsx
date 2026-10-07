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
  acceptsChannelDetail,
  APPLICATION_CHANNELS,
  APPLICATION_STATUSES,
  type ApplicationTextField as LimitedField,
  computeFollowUpDate,
  FOLLOW_UP_STATUS,
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
import { applyServerErrors } from '../../lib/server-errors';
import {
  type ApplicationFormField,
  type ApplicationFormValues,
  applicationFormSchema,
} from './application-form.schema';

export type ApplicationFormOutput = ReturnType<typeof applicationFormSchema.parse>;

/** Form value of a date the picker cannot parse: fails the `isCalendarDate` validation. */
const INVALID_DATE = 'invalid';

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
  const { t } = useTranslation();
  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
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
   * Date field: the form holds `YYYY-MM-DD` ('' when empty), the picker a dayjs date. `shown`
   * and `stored` translate between the two when the field has a computed default.
   */
  const dateField = (
    name: 'sentAt' | 'followUpOverride',
    options: {
      required?: boolean;
      helperText?: string;
      shown?: (value: string) => string;
      stored?: (date: string) => string;
    } = {},
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const shown = options.shown?.(field.value) ?? field.value;
        return (
          <DatePicker
            label={t(`form.fields.${name}`)}
            value={isCalendarDate(shown) ? dayjs(shown) : null}
            onChange={(date) => {
              if (date === null) return field.onChange('');
              // An impossible date stays invalid (and flagged), instead of being replaced.
              if (!date.isValid()) return field.onChange(INVALID_DATE);
              const value = date.format('YYYY-MM-DD');
              field.onChange(options.stored ? options.stored(value) : value);
            }}
            inputRef={field.ref}
            slotProps={{
              textField: {
                name: field.name,
                required: options.required,
                fullWidth: true,
                onBlur: field.onBlur,
                error: Boolean(fieldState.error),
                helperText: translateFieldError(t, fieldState.error) ?? options.helperText,
              },
            }}
          />
        );
      }}
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

  // The follow-up date, like the spreadsheet column: computed from the sent date unless the
  // user picks another one. Picking the computed date keeps it computed.
  const [sentAt, status, channel, followUpOverride] = useWatch({
    control,
    name: ['sentAt', 'status', 'channel', 'followUpOverride'],
  });
  const computedFollowUp =
    followUpDelayDays === undefined || !isCalendarDate(sentAt)
      ? null
      : computeFollowUpDate(sentAt, FOLLOW_UP_STATUS, followUpDelayDays);
  const followUpHelp = followUpOverride
    ? t('form.followUpSetByHand')
    : followUpDelayDays === undefined
      ? undefined
      : t('form.followUpComputed', { days: followUpDelayDays });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values, dirtyFields);
    } catch (error) {
      applyServerErrors(error, setError, FORM_FIELDS, t);
    }
  });

  return (
    <Box component="form" noValidate onSubmit={(event) => void submit(event)}>
      <Stack spacing={3}>
        <FormErrorAlert error={errors.root?.server} />

        <Section title={t('form.sections.offer')}>
          <Grid size={{ xs: 12, md: 4 }}>{dateField('sentAt', { required: true })}</Grid>
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
          {acceptsChannelDetail(channel || null) && (
            <Grid size={{ xs: 12, md: 4 }}>{textField('channelDetail')}</Grid>
          )}
          <Grid size={{ xs: 12, md: 4 }}>{textField('contact')}</Grid>
          {status === FOLLOW_UP_STATUS ? (
            <Grid size={{ xs: 12, md: 4 }}>
              {dateField('followUpOverride', {
                helperText: followUpHelp,
                shown: (value) => value || (computedFollowUp ?? ''),
                stored: (date) => (date === computedFollowUp ? '' : date),
              })}
              {followUpOverride && (
                <Button
                  size="small"
                  onClick={() =>
                    setValue('followUpOverride', '', { shouldDirty: true, shouldValidate: true })
                  }
                >
                  {t('form.followUpReset')}
                </Button>
              )}
            </Grid>
          ) : (
            <Grid size={12}>
              <Alert severity="success" role="status">
                {t('form.noFollowUp')}
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
