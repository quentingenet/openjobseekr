import { describe, expect, it } from 'vitest';
import type { Application } from '../../api/types';
import {
  applicationFormSchema,
  applicationToForm,
  emptyApplicationForm,
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
  channelDetail: null,
  status: 'SENT',
  contact: 'Marie',
  followUpDate: '2026-10-08',
  followUpOverride: null,
  followUpOverdue: false,
  followUpCount: 0,
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
      channelDetail: null,
      status: 'SENT',
      contact: null,
      followUpOverride: null,
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

describe('channel precision', () => {
  const base = { ...emptyApplicationForm('2026-10-01'), company: 'Acme', jobTitle: 'Dev' };

  it('is sent with the OTHER channel', () => {
    const values = applicationFormSchema.parse({
      ...base,
      channel: 'OTHER',
      channelDetail: ' Monster ',
    });

    expect(toCreateInput(values)).toMatchObject({ channel: 'OTHER', channelDetail: 'Monster' });
  });

  it('is dropped with any other channel, even if it was typed before', () => {
    const values = applicationFormSchema.parse({
      ...base,
      channel: 'APEC',
      channelDetail: 'Monster',
    });

    expect(toCreateInput(values)).toMatchObject({ channel: 'APEC', channelDetail: null });
  });

  it('on edit, is sent with its channel even when only the precision changed', () => {
    const values = applicationFormSchema.parse({
      ...base,
      channel: 'OTHER',
      channelDetail: 'Malt',
    });

    expect(toUpdateInput(values, { channelDetail: true })).toEqual({
      channelDetail: 'Malt',
      channel: 'OTHER',
    });
  });
});

describe('follow-up date set by the user', () => {
  const base = { ...emptyApplicationForm('2026-10-01'), company: 'Acme', jobTitle: 'Dev' };

  it('is sent as typed, or as null to go back to the computed date', () => {
    const set = applicationFormSchema.parse({ ...base, followUpOverride: '2026-10-20' });
    const computed = applicationFormSchema.parse(base);

    expect(toCreateInput(set).followUpOverride).toBe('2026-10-20');
    expect(toCreateInput(computed).followUpOverride).toBeNull();
  });

  it('rejects an invalid date', () => {
    const result = applicationFormSchema.safeParse({ ...base, followUpOverride: '2026-02-30' });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => [issue.path, issue.message])).toEqual([
      [['followUpOverride'], 'validation.date'],
    ]);
  });

  it('is loaded from the application', () => {
    expect(applicationToForm({ ...application, followUpOverride: '2026-10-20' })).toMatchObject({
      followUpOverride: '2026-10-20',
    });
    expect(applicationToForm(application).followUpOverride).toBe('');
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
