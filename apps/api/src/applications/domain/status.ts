/**
 * Application statuses, mirrored from the Prisma `Status` enum so that the domain does not
 * import Prisma. `domain-enums.check.ts` fails to compile if the two drift apart.
 */
export const APPLICATION_STATUSES = [
  'SENT',
  'RESPONSE_RECEIVED',
  'HR_INTERVIEW',
  'TECHNICAL_INTERVIEW',
  'OFFER',
  'REJECTED',
  'NO_RESPONSE',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
