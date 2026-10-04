import {
  APPLICATION_CHANNELS,
  APPLICATION_STATUSES,
  type ApplicationChannel,
  type ApplicationStatus,
} from '@openjobseekr/domain';
import { computeResponseRate } from './response-rate.js';

/** Bucket for applications without a channel (the column is optional in the spreadsheet). */
export const UNSPECIFIED_CHANNEL = 'UNSPECIFIED';

export interface Overview {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  byChannel: Record<ApplicationChannel | typeof UNSPECIFIED_CHANNEL, number>;
  responseRate: number | null;
}

/** Number of applications with a given status and channel. */
export interface ApplicationGroup {
  status: ApplicationStatus;
  channel: ApplicationChannel | null;
  count: number;
}

/** Statistics over a user's applications. Every code is present, even with a zero count. */
export function buildOverview(groups: readonly ApplicationGroup[]): Overview {
  const byStatus = Object.fromEntries(
    APPLICATION_STATUSES.map((s) => [s, 0]),
  ) as Overview['byStatus'];
  const byChannel = Object.fromEntries(
    [...APPLICATION_CHANNELS, UNSPECIFIED_CHANNEL].map((c) => [c, 0]),
  ) as Overview['byChannel'];

  let total = 0;
  for (const { status, channel, count } of groups) {
    byStatus[status] += count;
    byChannel[channel ?? UNSPECIFIED_CHANNEL] += count;
    total += count;
  }

  return { total, byStatus, byChannel, responseRate: computeResponseRate(byStatus) };
}
