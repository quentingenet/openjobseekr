import { describe, expect, it } from 'vitest';
import { computeResponseRate } from './response-rate.js';

const zero = {
  SENT: 0,
  RESPONSE_RECEIVED: 0,
  HR_INTERVIEW: 0,
  TECHNICAL_INTERVIEW: 0,
  OFFER: 0,
  REJECTED: 0,
  NO_RESPONSE: 0,
};

describe('computeResponseRate', () => {
  it('is 0 when none of the 6 applications got a response', () => {
    expect(computeResponseRate({ ...zero, SENT: 4, NO_RESPONSE: 2 })).toBe(0);
  });

  it('is 0.5 with 2 responses out of 4', () => {
    expect(
      computeResponseRate({ ...zero, SENT: 1, HR_INTERVIEW: 1, REJECTED: 1, NO_RESPONSE: 1 }),
    ).toBe(0.5);
  });

  it('counts every status except SENT and NO_RESPONSE as a response', () => {
    expect(
      computeResponseRate({
        ...zero,
        RESPONSE_RECEIVED: 1,
        HR_INTERVIEW: 1,
        TECHNICAL_INTERVIEW: 1,
        OFFER: 1,
        REJECTED: 1,
      }),
    ).toBe(1);
  });

  it('is null when there are no applications', () => {
    expect(computeResponseRate(zero)).toBeNull();
  });
});
