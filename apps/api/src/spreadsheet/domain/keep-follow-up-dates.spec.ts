import { describe, expect, it } from 'vitest';
import { keepFollowUpDates } from './keep-follow-up-dates.js';

const row = (company: string, followUpOverride: string | null = null, sentAt = '2026-10-01') => ({
  sentAt,
  company,
  jobTitle: 'Backend developer',
  followUpOverride,
});

describe('keepFollowUpDates', () => {
  it('keeps the date picked in the app for the same application', () => {
    const result = keepFollowUpDates(
      [row('Acme'), row('Globex')],
      [row('Acme', '2026-10-20'), row('Globex')],
    );

    expect(result).toEqual({
      applications: [row('Acme', '2026-10-20'), row('Globex')],
      kept: 1,
    });
  });

  it('matches ignoring case and extra spaces in the company and job title', () => {
    const imported = { ...row(' ACME  corp '), jobTitle: 'backend   DEVELOPER' };

    const result = keepFollowUpDates([imported], [row('Acme Corp', '2026-10-20')]);

    expect(result.applications[0]?.followUpOverride).toBe('2026-10-20');
  });

  it('lets a date typed by hand in the file win', () => {
    const result = keepFollowUpDates([row('Acme', '2026-10-25')], [row('Acme', '2026-10-20')]);

    expect(result).toEqual({ applications: [row('Acme', '2026-10-25')], kept: 0 });
  });

  it('does not match another sent date', () => {
    const result = keepFollowUpDates(
      [row('Acme', null, '2026-10-02')],
      [row('Acme', '2026-10-20', '2026-10-01')],
    );

    expect(result.kept).toBe(0);
  });

  it('keeps nothing when the match is ambiguous', () => {
    expect(keepFollowUpDates([row('Acme'), row('Acme')], [row('Acme', '2026-10-20')]).kept).toBe(0);
    expect(
      keepFollowUpDates([row('Acme')], [row('Acme', '2026-10-20'), row('Acme', '2026-10-22')]).kept,
    ).toBe(0);
  });
});
