import { APPLICATION_CHANNELS, type ApplicationChannel } from './channel.js';
import { computeResponseRate } from './response-rate.js';
import { APPLICATION_STATUSES, type ApplicationStatus } from './status.js';

/** Bucket for applications without a channel (the column is optional in the spreadsheet). */
export const UNSPECIFIED_CHANNEL = 'UNSPECIFIED';

export interface Overview {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  byChannel: Record<ApplicationChannel | typeof UNSPECIFIED_CHANNEL, number>;
  responseRate: number | null;
}

/** Statistics over a user's applications. Every code is present, even with a zero count. */
export function buildOverview(
  applications: readonly { status: ApplicationStatus; channel: ApplicationChannel | null }[],
): Overview {
  const byStatus = Object.fromEntries(
    APPLICATION_STATUSES.map((s) => [s, 0]),
  ) as Overview['byStatus'];
  const byChannel = Object.fromEntries(
    [...APPLICATION_CHANNELS, UNSPECIFIED_CHANNEL].map((c) => [c, 0]),
  ) as Overview['byChannel'];

  for (const { status, channel } of applications) {
    byStatus[status] += 1;
    byChannel[channel ?? UNSPECIFIED_CHANNEL] += 1;
  }

  return {
    total: applications.length,
    byStatus,
    byChannel,
    responseRate: computeResponseRate(applications.map((a) => a.status)),
  };
}
