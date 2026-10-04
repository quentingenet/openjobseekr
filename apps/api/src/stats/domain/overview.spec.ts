import { describe, expect, it } from 'vitest';
import { buildOverview } from './overview.js';

const zeroByStatus = {
  SENT: 0,
  RESPONSE_RECEIVED: 0,
  HR_INTERVIEW: 0,
  TECHNICAL_INTERVIEW: 0,
  OFFER: 0,
  REJECTED: 0,
  NO_RESPONSE: 0,
};

const zeroByChannel = {
  CAREER_SITE: 0,
  LINKEDIN: 0,
  WELCOME_TO_THE_JUNGLE: 0,
  HELLOWORK: 0,
  APEC: 0,
  RECRUITMENT_AGENCY: 0,
  UNSOLICITED: 0,
  REFERRAL: 0,
  OTHER: 0,
  UNSPECIFIED: 0,
};

describe('buildOverview', () => {
  it('returns every code with zero counts and a null rate when there are no applications', () => {
    expect(buildOverview([])).toEqual({
      total: 0,
      byStatus: zeroByStatus,
      byChannel: zeroByChannel,
      responseRate: null,
    });
  });

  it('counts by status and channel, with UNSPECIFIED for a missing channel', () => {
    // Counts per (status, channel), as the database groups them.
    const overview = buildOverview([
      { status: 'SENT', channel: 'LINKEDIN', count: 2 },
      { status: 'HR_INTERVIEW', channel: 'APEC', count: 1 },
      { status: 'REJECTED', channel: null, count: 1 },
    ]);

    expect(overview).toEqual({
      total: 4,
      byStatus: { ...zeroByStatus, SENT: 2, HR_INTERVIEW: 1, REJECTED: 1 },
      byChannel: { ...zeroByChannel, LINKEDIN: 2, APEC: 1, UNSPECIFIED: 1 },
      responseRate: 0.5,
    });
  });
});
