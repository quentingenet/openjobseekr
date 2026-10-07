import { addDays } from './calendar-date.js';
import type { ApplicationStatus } from './status.js';

/** The status of an application waiting for an answer: the only one with a follow-up date. */
export const FOLLOW_UP_STATUS = 'SENT' satisfies ApplicationStatus;

/**
 * Follow-up date ("DATE DE RELANCE"), only while waiting for an answer: the date the user set
 * (`followUpOverride`), otherwise sent date + delay. Only the user's date is stored.
 */
export function computeFollowUpDate(
  sentAt: string,
  status: ApplicationStatus,
  delayDays: number,
  followUpOverride: string | null = null,
): string | null {
  if (status !== FOLLOW_UP_STATUS) return null;
  return followUpOverride ?? addDays(sentAt, delayDays);
}

/** Overdue from the day after the follow-up date. `today` is passed in: no hidden clock. */
export function isFollowUpOverdue(followUpDate: string | null, today: string): boolean {
  // `YYYY-MM-DD` strings sort chronologically.
  return followUpDate !== null && today > followUpDate;
}

/**
 * Database-side equivalent of `isFollowUpOverdue` for a computed date: a `FOLLOW_UP_STATUS`
 * application without `followUpOverride` is overdue when
 * `sentAt < overdueSentBefore(today, delayDays)`; with one, when `followUpOverride < today`.
 */
export function overdueSentBefore(today: string, delayDays: number): string {
  return addDays(today, -delayDays);
}
