import { describe, expect, it } from 'vitest';
import type { Application } from '../../api/types';
import {
  applicationFormSchema,
  applicationToForm,
  constraintToMessage,
  emptyApplicationForm,
  isCalendarDate,
  toCreateInput,
  toUpdateInput,
} from './application-form.schema';

const application: Application = {
  id: '6c3f4d2e-0000-4000-8000-000000000001',
  sentAt: '2026-10-01',
  company: 'Acme',
  jobTitle: 'Backend developer',
  location: null,
  response: null,
  resources: null,
  channel: 'LINKEDIN',
  status: 'SENT',
  contact: 'Marie',
  followUpDate: '2026-10-08',
  followUpOverdue: false,
  workMode: null,
  remoteRhythm: null,
  salaryRange: null,
  cvVersion: null,
  stack: null,
  recruitmentProcess: null,
  notes: 'Call back',
  jobPostingText: null,
  createdAt: '2026-10-01T09:00:00.000Z',
  updatedAt: '2026-10-01T09:00:00.000Z',
};

describe('isCalendarDate', () => {
  it.each(['2026-10-01', '2028-02-29'])('accepts %s', (value) => {
    expect(isCalendarDate(value)).toBe(true);
  });

  it.each(['', '2026-02-30', '2026-13-01', '01/10/2026'])('rejects "%s"', (value) => {
    expect(isCalendarDate(value)).toBe(false);
  });
});

describe('applicationFormSchema', () => {
  it('requires company and job title, and trims text', () => {
    const result = applicationFormSchema.safeParse({
      ...emptyApplicationForm('2026-10-01'),
      company: '   ',
      location: '  Lyon  ',
    });

    expect(result.success).toBe(false);
    const issues = result.error?.issues.map((issue) => [issue.path.join('.'), issue.message]);
    expect(issues).toEqual([
      ['company', 'validation.required'],
      ['jobTitle', 'validation.required'],
    ]);
  });

  it('rejects texts over the API limits', () => {
    const result = applicationFormSchema.safeParse({
      ...emptyApplicationForm('2026-10-01'),
      company: 'a'.repeat(201),
      jobTitle: 'Dev',
    });

    expect(result.error?.issues.map((issue) => [issue.path.join('.'), issue.message])).toEqual([
      ['company', 'validation.tooLong'],
    ]);
  });
});

describe('toCreateInput', () => {
  it('sends empty optional fields as null', () => {
    const values = applicationFormSchema.parse({
      ...emptyApplicationForm('2026-10-01'),
      company: ' Acme ',
      jobTitle: 'Dev',
      channel: 'APEC',
    });

    expect(toCreateInput(values)).toEqual({
      sentAt: '2026-10-01',
      company: 'Acme',
      jobTitle: 'Dev',
      location: null,
      response: null,
      resources: null,
      channel: 'APEC',
      status: 'SENT',
      contact: null,
      workMode: null,
      remoteRhythm: null,
      salaryRange: null,
      cvVersion: null,
      stack: null,
      recruitmentProcess: null,
      notes: null,
      jobPostingText: null,
    });
  });
});

describe('toUpdateInput', () => {
  it('only sends the fields the user changed, clearing emptied ones', () => {
    const values = applicationFormSchema.parse({
      ...applicationToForm(application),
      status: 'HR_INTERVIEW',
      notes: '',
    });

    expect(toUpdateInput(values, { status: true, notes: true, company: false })).toEqual({
      status: 'HR_INTERVIEW',
      notes: null,
    });
  });
});

describe('applicationToForm', () => {
  it('turns null values into empty strings', () => {
    const form = applicationToForm(application);

    expect(form.location).toBe('');
    expect(form.workMode).toBe('');
    expect(form.channel).toBe('LINKEDIN');
    expect(form.notes).toBe('Call back');
    expect(form).not.toHaveProperty('id');
    expect(form).not.toHaveProperty('followUpDate');
  });
});

describe('constraintToMessage', () => {
  it.each([
    [['isNotEmpty', 'isString'], 'validation.required'],
    [['maxLength'], 'validation.tooLong'],
    [['isCalendarDate'], 'validation.date'],
    [['isEnum'], 'validation.invalid'],
  ])('maps %j to %s', (constraints, key) => {
    expect(constraintToMessage(constraints)).toBe(key);
  });
});
