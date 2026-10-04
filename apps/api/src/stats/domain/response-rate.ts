import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
  FOLLOW_UP_STATUS,
} from '@openjobseekr/domain';

// Still waiting for an answer, or given up on: neither counts as a response.
const NO_ANSWER_STATUSES: ReadonlySet<ApplicationStatus> = new Set([
  FOLLOW_UP_STATUS,
  'NO_RESPONSE',
]);

/** Share of applications that got any answer. `null` when there are no applications. */
export function computeResponseRate(
  countByStatus: Readonly<Record<ApplicationStatus, number>>,
): number | null {
  const sum = (statuses: readonly ApplicationStatus[]) =>
    statuses.reduce((total, status) => total + countByStatus[status], 0);
  const total = sum(APPLICATION_STATUSES);
  if (total === 0) return null;
  return sum(APPLICATION_STATUSES.filter((status) => !NO_ANSWER_STATUSES.has(status))) / total;
}
