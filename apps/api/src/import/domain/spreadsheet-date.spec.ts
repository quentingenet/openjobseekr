import { describe, expect, it } from 'vitest';
import { toCalendarDateCell } from './spreadsheet-date.js';

describe('toCalendarDateCell', () => {
  it('converts a date serial number of the 1900 date system', () => {
    expect(toCalendarDateCell(46296, false)).toBe('2026-10-01');
    expect(toCalendarDateCell(61, false)).toBe('1900-03-01');
  });

  it('converts a date serial number of the 1904 date system', () => {
    expect(toCalendarDateCell(0, true)).toBe('1904-01-01');
    expect(toCalendarDateCell(44834, true)).toBe('2026-10-01');
  });

  it('drops the time of day', () => {
    expect(toCalendarDateCell(46296.75, false)).toBe('2026-10-01');
  });

  it('reads dates typed as text, day first or ISO', () => {
    expect(toCalendarDateCell('01/10/2026', false)).toBe('2026-10-01');
    expect(toCalendarDateCell('1/9/2026', false)).toBe('2026-09-01');
    expect(toCalendarDateCell(' 2026-10-01 ', false)).toBe('2026-10-01');
  });

  it('rejects anything else', () => {
    expect(toCalendarDateCell('31/02/2026', false)).toBeNull();
    expect(toCalendarDateCell('1/10/26', false)).toBeNull();
    expect(toCalendarDateCell('next monday', false)).toBeNull();
    expect(toCalendarDateCell(-1, false)).toBeNull();
    expect(toCalendarDateCell(true, false)).toBeNull();
    expect(toCalendarDateCell(null, false)).toBeNull();
  });
});
