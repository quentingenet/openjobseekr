import { isCalendarDate } from '@openjobseekr/domain';
import { z } from 'zod';
import {
  APPLICATION_CHANNELS,
  APPLICATION_STATUSES,
  WORK_MODES,
  type Application,
  type CreateApplicationInput,
  type UpdateApplicationInput,
} from '../../api/types';
import { TEXT_LIMITS } from './limits';

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

const OPTIONAL_FIELDS = [
  'location',
  'response',
  'resources',
  'channel',
  'channelDetail',
  'contact',
  'workMode',
  'remoteRhythm',
  'salaryRange',
  'cvVersion',
  'stack',
  'recruitmentProcess',
  'notes',
  'jobPostingText',
] as const satisfies readonly ApplicationFormField[];

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

/** Optional fields left empty are sent as `null` (cleared). */
export function toCreateInput(values: ParsedForm): CreateApplicationInput {
  const input: Record<string, unknown> = { ...values };
  for (const field of OPTIONAL_FIELDS) {
    if (input[field] === '') input[field] = null;
  }
  // The precision only belongs to the OTHER channel (the API rejects it otherwise).
  if (input.channel !== 'OTHER') input.channelDetail = null;
  return input as unknown as CreateApplicationInput;
}

/** On edit, only the fields the user changed are sent. */
export function toUpdateInput(
  values: ParsedForm,
  dirtyFields: Partial<Record<ApplicationFormField, unknown>>,
): UpdateApplicationInput {
  const full = toCreateInput(values) as unknown as Record<string, unknown>;
  const changed = Object.keys(dirtyFields).filter(
    (field) => dirtyFields[field as ApplicationFormField],
  );
  // The API needs the channel alongside its precision.
  if (changed.includes('channelDetail') && !changed.includes('channel')) changed.push('channel');
  return Object.fromEntries(changed.map((field) => [field, full[field]])) as UpdateApplicationInput;
}
