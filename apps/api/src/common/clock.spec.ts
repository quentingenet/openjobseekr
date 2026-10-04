import { afterEach, describe, expect, it, vi } from 'vitest';
import { Clock } from './clock.js';

describe('Clock', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the local date as YYYY-MM-DD', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 4, 23, 59)); // 4 October 2026, 23:59 local time

    expect(new Clock().today()).toBe('2026-10-04');
  });

  it('pads single-digit months and days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2027, 0, 5, 0, 1)); // 5 January 2027, 00:01 local time

    expect(new Clock().today()).toBe('2027-01-05');
  });
});
