import { describe, expect, it } from 'vitest';
import { formatDate, formatPercent } from './format';

describe('format', () => {
  it('formats a calendar date in the active language without shifting the day', () => {
    expect(formatDate('2026-10-08', 'en')).toBe('Oct 8, 2026');
    expect(formatDate('2026-10-08', 'fr')).toBe('8 oct. 2026');
  });

  it('formats a ratio as a percentage', () => {
    expect(formatPercent(0.5, 'en')).toBe('50%');
    // French puts a no-break space (U+00A0) before %.
    expect(formatPercent(0.4, 'fr')).toBe('40\u00a0%');
  });
});
