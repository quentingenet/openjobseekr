/** Work modes, mirrored from the Prisma `WorkMode` enum (see `domain-enums.check.ts`). */
export const WORK_MODES = ['ONSITE', 'HYBRID', 'FULL_REMOTE', 'UNSPECIFIED'] as const;

export type WorkMode = (typeof WORK_MODES)[number];
