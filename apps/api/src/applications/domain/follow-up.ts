import { addDays } from '../../common/calendar-date.js';
import type { ApplicationStatus } from './status.js';

/** Follow-up date ("DATE DE RELANCE"): sent date + delay, only while waiting for an answer. */
export function computeFollowUpDate(
  sentAt: string,
  status: ApplicationStatus,
  delayDays: number,
): string | null {
  return status === 'SENT' ? addDays(sentAt, delayDays) : null;
}

/** Overdue from the day after the follow-up date. `today` is passed in: no hidden clock. */
export function isFollowUpOverdue(followUpDate: string | null, today: string): boolean {
  // `YYYY-MM-DD` strings sort chronologically.
  return followUpDate !== null && today > followUpDate;
}

/**
 * Database-side equivalent of `isFollowUpOverdue`: a SENT application is overdue when
 * `sentAt < overdueSentBefore(today, delayDays)`.
 */
export function overdueSentBefore(today: string, delayDays: number): string {
  return addDays(today, -delayDays);
}
