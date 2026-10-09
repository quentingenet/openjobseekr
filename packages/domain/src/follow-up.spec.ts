import { describe, expect, it } from 'vitest';
import {
  afterFollowUp,
  computeFollowUpDate,
  followUpRank,
  isFollowUpOverdue,
  overdueSentBefore,
} from './follow-up.js';
import { FOLLOW_UP_COUNT } from './limits.js';

describe('computeFollowUpDate', () => {
  // Values from the original spreadsheet ("DATE DE RELANCE" = sent date + 7 days).
  it.each([
    ['2026-10-01', '2026-10-08'],
    ['2026-10-02', '2026-10-09'],
    ['2026-10-03', '2026-10-10'],
  ])('sent %s, status SENT, delay 7 -> %s', (sentAt, expected) => {
    expect(computeFollowUpDate(sentAt, 'SENT', 7)).toBe(expected);
  });

  it('crosses month and year boundaries', () => {
    expect(computeFollowUpDate('2026-10-28', 'SENT', 7)).toBe('2026-11-04');
    expect(computeFollowUpDate('2026-12-29', 'SENT', 7)).toBe('2027-01-05');
  });

  it('handles a leap day', () => {
    expect(computeFollowUpDate('2028-02-25', 'SENT', 7)).toBe('2028-03-03');
  });

  it('is not shifted by the daylight saving time change (France, 2026-10-25)', () => {
    expect(computeFollowUpDate('2026-10-22', 'SENT', 7)).toBe('2026-10-29');
  });

  it('returns the sent date itself with a zero delay', () => {
    expect(computeFollowUpDate('2026-10-01', 'SENT', 0)).toBe('2026-10-01');
  });

  it.each([
    'RESPONSE_RECEIVED',
    'HR_INTERVIEW',
    'TECHNICAL_INTERVIEW',
    'OFFER',
    'REJECTED',
    'NO_RESPONSE',
  ] as const)('returns null for status %s', (status) => {
    expect(computeFollowUpDate('2026-10-01', status, 7)).toBeNull();
  });
});

describe('computeFollowUpDate with a date set by the user', () => {
  it('uses the date set by the user instead of the computed one', () => {
    expect(computeFollowUpDate('2026-10-01', 'SENT', 7, '2026-10-20')).toBe('2026-10-20');
  });

  it('computes the date when the user has not set one', () => {
    expect(computeFollowUpDate('2026-10-01', 'SENT', 7, null)).toBe('2026-10-08');
  });

  it('has no follow-up once an answer is received, even with a date set', () => {
    expect(computeFollowUpDate('2026-10-01', 'REJECTED', 7, '2026-10-20')).toBeNull();
  });
});

describe('isFollowUpOverdue', () => {
  it('is overdue when today is after the follow-up date', () => {
    expect(isFollowUpOverdue('2026-10-08', '2026-10-09')).toBe(true);
  });

  it('is not overdue on the follow-up date itself', () => {
    expect(isFollowUpOverdue('2026-10-08', '2026-10-08')).toBe(false);
  });

  it('is not overdue before the follow-up date', () => {
    expect(isFollowUpOverdue('2026-10-08', '2026-10-07')).toBe(false);
  });

  it('compares across months correctly', () => {
    expect(isFollowUpOverdue('2026-09-30', '2026-10-01')).toBe(true);
  });

  it('is never overdue without a follow-up date', () => {
    expect(isFollowUpOverdue(null, '2026-10-09')).toBe(false);
  });
});

describe('overdueSentBefore', () => {
  // An application is overdue when today > sentAt + delay, i.e. sentAt < today - delay.
  it('returns today minus the delay', () => {
    expect(overdueSentBefore('2026-10-09', 7)).toBe('2026-10-02');
  });

  it('matches isFollowUpOverdue at the boundary', () => {
    const today = '2026-10-09';
    const limit = overdueSentBefore(today, 7);
    // Sent the day before the limit: overdue. Sent on the limit: due today, not overdue.
    expect(isFollowUpOverdue(computeFollowUpDate('2026-10-01', 'SENT', 7), today)).toBe(true);
    expect('2026-10-01' < limit).toBe(true);
    expect(isFollowUpOverdue(computeFollowUpDate('2026-10-02', 'SENT', 7), today)).toBe(false);
    expect('2026-10-02' < limit).toBe(false);
  });

  it('crosses a month boundary', () => {
    expect(overdueSentBefore('2026-11-03', 7)).toBe('2026-10-27');
  });
});

describe('afterFollowUp', () => {
  it('schedules the next follow-up one delay after today and counts the follow-up', () => {
    expect(afterFollowUp(0, '2026-10-09', 7)).toEqual({
      followUpOverride: '2026-10-16',
      followUpCount: 1,
    });
    expect(afterFollowUp(2, '2026-10-28', 7)).toEqual({
      followUpOverride: '2026-11-04',
      followUpCount: 3,
    });
  });

  it('is no longer overdue once the follow-up is recorded', () => {
    const today = '2026-10-09';
    expect(isFollowUpOverdue(afterFollowUp(0, today, 7).followUpOverride, today)).toBe(false);
  });

  it('stops counting at the maximum', () => {
    expect(afterFollowUp(FOLLOW_UP_COUNT.max, '2026-10-09', 7).followUpCount).toBe(
      FOLLOW_UP_COUNT.max,
    );
  });
});

describe('followUpRank', () => {
  it('is the rank of the next follow-up, once the user has followed up', () => {
    expect(followUpRank(1)).toBe(2);
    expect(followUpRank(4)).toBe(5);
  });

  it('is null before any follow-up: the first one needs no rank', () => {
    expect(followUpRank(0)).toBeNull();
  });
});
