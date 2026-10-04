/**
 * Application statuses, mirrored from the Prisma `Status` enum so that the domain does not
 * import Prisma. The `domain-enums.check.ts` files of the API and the web app fail to compile
 * if they drift apart.
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
