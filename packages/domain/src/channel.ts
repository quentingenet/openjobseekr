/**
 * Application channels, mirrored from the Prisma `Channel` enum (see `domain-enums.check.ts` in
 * the API and the web app).
 */
export const APPLICATION_CHANNELS = [
  'CAREER_SITE',
  'LINKEDIN',
  'WELCOME_TO_THE_JUNGLE',
  'HELLOWORK',
  'APEC',
  'RECRUITMENT_AGENCY',
  'UNSOLICITED',
  'REFERRAL',
  'OTHER',
] as const;

export type ApplicationChannel = (typeof APPLICATION_CHANNELS)[number];
