import { describe, expect, it } from 'vitest';
import { computeResponseRate } from './response-rate.js';

describe('computeResponseRate', () => {
  it('is 0 when none of the 6 applications got a response', () => {
    expect(
      computeResponseRate(['SENT', 'SENT', 'SENT', 'NO_RESPONSE', 'SENT', 'NO_RESPONSE']),
    ).toBe(0);
  });

  it('is 0.5 with 2 responses out of 4', () => {
    expect(computeResponseRate(['SENT', 'HR_INTERVIEW', 'REJECTED', 'NO_RESPONSE'])).toBe(0.5);
  });

  it('counts every status except SENT and NO_RESPONSE as a response', () => {
    expect(
      computeResponseRate([
        'RESPONSE_RECEIVED',
        'HR_INTERVIEW',
        'TECHNICAL_INTERVIEW',
        'OFFER',
        'REJECTED',
      ]),
    ).toBe(1);
  });

  it('is null when there are no applications', () => {
    expect(computeResponseRate([])).toBeNull();
  });
});
