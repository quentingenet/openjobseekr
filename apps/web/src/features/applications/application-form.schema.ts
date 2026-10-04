import {
  APPLICATION_CHANNELS,
  APPLICATION_STATUSES,
  isCalendarDate,
  TEXT_LIMITS,
  WORK_MODES,
} from '@openjobseekr/domain';
import { z } from 'zod';
import type { Application, CreateApplicationInput, UpdateApplicationInput } from '../../api/types';

// Messages are translation keys, translated when displayed.
const requiredText = (max: number) =>
  z.string().trim().min(1, 'validation.required').max(max, 'validation.tooLong');
const optionalText = (max: number) => z.string().trim().max(max, 'validation.tooLong');

/** Mirrors the API validation, so most errors are caught before sending. */
export const applicationFormSchema = z.object({
  sentAt: z.string().refine(isCalendarDate, 'validation.date'),
  company: requiredText(TEXT_LIMITS.company),
  jobTitle: requiredText(TEXT_LIMITS.jobTitle),
  location: optionalText(TEXT_LIMITS.location),
  response: optionalText(TEXT_LIMITS.response),
  resources: optionalText(TEXT_LIMITS.resources),
  channel: z.union([z.enum(APPLICATION_CHANNELS), z.literal('')]),
  channelDetail: optionalText(TEXT_LIMITS.channelDetail),
  status: z.enum(APPLICATION_STATUSES),
  contact: optionalText(TEXT_LIMITS.contact),
  workMode: z.union([z.enum(WORK_MODES), z.literal('')]),
  remoteRhythm: optionalText(TEXT_LIMITS.remoteRhythm),
  salaryRange: optionalText(TEXT_LIMITS.salaryRange),
  cvVersion: optionalText(TEXT_LIMITS.cvVersion),
  stack: optionalText(TEXT_LIMITS.stack),
  recruitmentProcess: optionalText(TEXT_LIMITS.recruitmentProcess),
  notes: optionalText(TEXT_LIMITS.notes),
  jobPostingText: optionalText(TEXT_LIMITS.jobPostingText),
});

/** Form state: empty inputs are '' (MUI inputs are controlled strings). */
export type ApplicationFormValues = z.input<typeof applicationFormSchema>;
export type ApplicationFormField = keyof ApplicationFormValues;

export function emptyApplicationForm(today: string): ApplicationFormValues {
  return {
    sentAt: today,
    company: '',
    jobTitle: '',
    location: '',
    response: '',
    resources: '',
    channel: '',
    channelDetail: '',
    status: 'SENT',
    contact: '',
    workMode: '',
    remoteRhythm: '',
    salaryRange: '',
    cvVersion: '',
    stack: '',
    recruitmentProcess: '',
    notes: '',
    jobPostingText: '',
  };
}

/** Form values of an existing application (`null` becomes ''). */
export function applicationToForm(application: Application): ApplicationFormValues {
  const values = emptyApplicationForm(application.sentAt);
  for (const field of Object.keys(values) as ApplicationFormField[]) {
    const value = application[field];
    (values as Record<string, unknown>)[field] = value ?? '';
  }
  return values;
}

type ParsedForm = z.output<typeof applicationFormSchema>;

/** An optional field left empty is sent as `null`, which clears it. */
function orNull<Value extends string>(value: Value | ''): Value | null {
  return value === '' ? null : value;
}

export function toCreateInput(values: ParsedForm): CreateApplicationInput {
  return {
    sentAt: values.sentAt,
    company: values.company,
    jobTitle: values.jobTitle,
    location: orNull(values.location),
    response: orNull(values.response),
    resources: orNull(values.resources),
    channel: orNull(values.channel),
    // The precision only belongs to the OTHER channel (the API rejects it otherwise).
    channelDetail: values.channel === 'OTHER' ? orNull(values.channelDetail) : null,
    status: values.status,
    contact: orNull(values.contact),
    workMode: orNull(values.workMode),
    remoteRhythm: orNull(values.remoteRhythm),
    salaryRange: orNull(values.salaryRange),
    cvVersion: orNull(values.cvVersion),
    stack: orNull(values.stack),
    recruitmentProcess: orNull(values.recruitmentProcess),
    notes: orNull(values.notes),
    jobPostingText: orNull(values.jobPostingText),
  };
}

function copyField<Input>(to: Partial<Input>, from: Input, field: keyof Input): void {
  to[field] = from[field];
}

/** On edit, only the fields the user changed are sent. */
export function toUpdateInput(
  values: ParsedForm,
  dirtyFields: Partial<Record<ApplicationFormField, unknown>>,
): UpdateApplicationInput {
  const full = toCreateInput(values);
  const input: UpdateApplicationInput = {};
  for (const field of applicationFormSchema.keyof().options) {
    // The API needs the channel alongside its precision.
    const send = dirtyFields[field] || (field === 'channel' && dirtyFields.channelDetail);
    if (send) copyField(input, full, field);
  }
  return input;
}
