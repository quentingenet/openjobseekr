import { describe, expect, it } from 'vitest';
import type { Application } from '../generated/prisma/client.js';
import {
  buildListWhere,
  escapeLikePattern,
  fromDbDate,
  toApplicationCreateData,
  toApplicationData,
  toApplicationDetail,
  toApplicationSummary,
  toDbDate,
} from './application.mapper.js';

const context = { today: '2026-10-09', delayDays: 7 };

const record: Application = {
  id: '6c3f4d2e-0000-4000-8000-000000000001',
  userId: 'user-1',
  sentAt: new Date('2026-10-01T00:00:00.000Z'),
  company: 'Acme',
  jobTitle: 'Backend developer',
  location: 'Lyon',
  response: null,
  resources: null,
  channel: 'LINKEDIN',
  channelDetail: null,
  status: 'SENT',
  contact: null,
  workMode: 'HYBRID',
  remoteRhythm: '2 days',
  salaryRange: null,
  cvVersion: 'v3',
  stack: 'Node, PostgreSQL',
  recruitmentProcess: null,
  notes: null,
  jobPostingText: 'We are hiring',
  createdAt: new Date('2026-10-01T09:30:00.000Z'),
  updatedAt: new Date('2026-10-02T10:00:00.000Z'),
};

describe('date conversion', () => {
  it('stores a calendar date as UTC midnight and reads it back unchanged', () => {
    expect(toDbDate('2026-10-25').toISOString()).toBe('2026-10-25T00:00:00.000Z');
    expect(fromDbDate(toDbDate('2026-10-25'))).toBe('2026-10-25');
  });
});

describe('toApplicationSummary', () => {
  it('computes the follow-up fields and never exposes userId or jobPostingText', () => {
    const summary = toApplicationSummary(record, context);

    expect(summary).toEqual({
      id: '6c3f4d2e-0000-4000-8000-000000000001',
      sentAt: '2026-10-01',
      company: 'Acme',
      jobTitle: 'Backend developer',
      location: 'Lyon',
      response: null,
      resources: null,
      channel: 'LINKEDIN',
      channelDetail: null,
      status: 'SENT',
      contact: null,
      followUpDate: '2026-10-08',
      followUpOverdue: true,
      workMode: 'HYBRID',
      remoteRhythm: '2 days',
      salaryRange: null,
      cvVersion: 'v3',
      stack: 'Node, PostgreSQL',
      recruitmentProcess: null,
      notes: null,
      createdAt: '2026-10-01T09:30:00.000Z',
      updatedAt: '2026-10-02T10:00:00.000Z',
    });
  });

  it('has no follow-up date once the status changed', () => {
    const summary = toApplicationSummary({ ...record, status: 'HR_INTERVIEW' }, context);

    expect(summary.followUpDate).toBeNull();
    expect(summary.followUpOverdue).toBe(false);
  });

  it('is not overdue on the follow-up date itself', () => {
    expect(toApplicationSummary(record, { ...context, today: '2026-10-08' }).followUpOverdue).toBe(
      false,
    );
  });
});

describe('toApplicationDetail', () => {
  it('adds the job posting text', () => {
    expect(toApplicationDetail(record, context).jobPostingText).toBe('We are hiring');
  });
});

describe('toApplicationCreateData', () => {
  it('sets the owner last so that the input cannot override it', () => {
    const dto = { sentAt: '2026-10-01', company: 'Acme', jobTitle: 'Dev', userId: 'attacker' };

    expect(toApplicationCreateData(dto, 'user-1')).toEqual({
      sentAt: new Date('2026-10-01T00:00:00.000Z'),
      company: 'Acme',
      jobTitle: 'Dev',
      channelDetail: null,
      userId: 'user-1',
    });
  });

  it('keeps the channel precision only for the OTHER channel', () => {
    const base = { sentAt: '2026-10-01', company: 'Acme', jobTitle: 'Dev' };

    expect(
      toApplicationCreateData({ ...base, channel: 'OTHER', channelDetail: 'Indeed' }, 'u')
        .channelDetail,
    ).toBe('Indeed');
    expect(toApplicationCreateData({ ...base, channel: 'APEC' }, 'u').channelDetail).toBeNull();
  });
});

describe('toApplicationData', () => {
  it('converts sentAt and keeps only the provided fields', () => {
    expect(toApplicationData({ sentAt: '2026-10-03', notes: null })).toEqual({
      sentAt: new Date('2026-10-03T00:00:00.000Z'),
      notes: null,
    });
    expect(toApplicationData({ status: 'REJECTED' })).toEqual({ status: 'REJECTED' });
  });

  it('clears the channel precision when the channel changes to anything but OTHER', () => {
    expect(toApplicationData({ channel: 'LINKEDIN' })).toEqual({
      channel: 'LINKEDIN',
      channelDetail: null,
    });
    expect(toApplicationData({ channel: null })).toEqual({ channel: null, channelDetail: null });
    expect(toApplicationData({ channel: 'OTHER', channelDetail: 'Malt' })).toEqual({
      channel: 'OTHER',
      channelDetail: 'Malt',
    });
  });
});

describe('buildListWhere', () => {
  it('only scopes by user when there is no filter', () => {
    expect(buildListWhere('user-1', {}, context)).toEqual({ AND: [{ userId: 'user-1' }] });
  });

  it('combines status, channel, search and overdue filters', () => {
    expect(
      buildListWhere(
        'user-1',
        { status: 'SENT', channel: 'APEC', q: 'acme', overdue: true },
        context,
      ),
    ).toEqual({
      AND: [
        { userId: 'user-1' },
        { status: 'SENT' },
        { channel: 'APEC' },
        { status: 'SENT', sentAt: { lt: new Date('2026-10-02T00:00:00.000Z') } },
        {
          OR: [
            { company: { contains: 'acme', mode: 'insensitive' } },
            { jobTitle: { contains: 'acme', mode: 'insensitive' } },
          ],
        },
      ],
    });
  });

  it('ignores overdue=false', () => {
    expect(buildListWhere('user-1', { overdue: false }, context)).toEqual({
      AND: [{ userId: 'user-1' }],
    });
  });
});

describe('escapeLikePattern', () => {
  it('escapes LIKE wildcards and the escape character', () => {
    expect(escapeLikePattern('100% remote_dev\\x')).toBe('100\\% remote\\_dev\\\\x');
  });

  it('leaves normal text unchanged', () => {
    expect(escapeLikePattern('Acme Corp')).toBe('Acme Corp');
  });
});
