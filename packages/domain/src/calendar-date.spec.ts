import { describe, expect, it } from 'vitest';
import { addDays, isCalendarDate, toCalendarDate } from './calendar-date.js';

describe('isCalendarDate', () => {
  it.each(['2026-10-01', '2028-02-29', '2026-12-31'])('accepts %s', (value) => {
    expect(isCalendarDate(value)).toBe(true);
  });

  it.each([
    '',
    '2026-02-30',
    '2027-02-29',
    '2026-13-01',
    '2026-10-1',
    '01/10/2026',
    '2026-10-01T00:00',
  ])('rejects "%s"', (value) => {
    expect(isCalendarDate(value)).toBe(false);
  });
});

describe('addDays', () => {
  it('adds and subtracts days', () => {
    expect(addDays('2026-10-01', 7)).toBe('2026-10-08');
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30');
  });

  it('adds days across months and years', () => {
    expect(addDays('2026-10-28', 7)).toBe('2026-11-04');
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
  });

  it('throws on an invalid date', () => {
    expect(() => addDays('2026-02-30', 1)).toThrow('Invalid calendar date: 2026-02-30');
  });
});

describe('toCalendarDate', () => {
  it('returns the local date, even late in the evening', () => {
    expect(toCalendarDate(new Date(2026, 9, 4, 23, 59))).toBe('2026-10-04');
  });

  it('pads single-digit months and days', () => {
    expect(toCalendarDate(new Date(2027, 0, 5, 0, 1))).toBe('2027-01-05');
  });
});
