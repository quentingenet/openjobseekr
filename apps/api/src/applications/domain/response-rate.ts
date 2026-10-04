import type { ApplicationStatus } from './status.js';

const NO_ANSWER_STATUSES: ReadonlySet<ApplicationStatus> = new Set(['SENT', 'NO_RESPONSE']);

/** Share of applications that got any answer. `null` when there are no applications. */
export function computeResponseRate(statuses: readonly ApplicationStatus[]): number | null {
  if (statuses.length === 0) return null;
  const responses = statuses.filter((status) => !NO_ANSWER_STATUSES.has(status)).length;
  return responses / statuses.length;
}
