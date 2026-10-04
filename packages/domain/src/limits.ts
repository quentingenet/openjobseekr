/**
 * Maximum text lengths per application field. The API DTOs and the web forms use these values;
 * the database CHECK constraints repeat them, checked by the API's `text-limits.spec.ts`.
 */
export const TEXT_LIMITS = {
  company: 200,
  jobTitle: 200,
  location: 200,
  response: 1_000,
  resources: 1_000,
  channelDetail: 200,
  contact: 200,
  remoteRhythm: 200,
  salaryRange: 200,
  cvVersion: 200,
  stack: 1_000,
  recruitmentProcess: 10_000,
  notes: 10_000,
  jobPostingText: 50_000,
} as const;

export type ApplicationTextField = keyof typeof TEXT_LIMITS;

/** Maximum lengths of a skill (also database CHECK constraints). */
export const SKILL_LIMITS = { name: 100, pattern: 200 } as const;

export const DEFAULT_PAGE_SIZE = 20;
/** The largest page the API accepts. */
export const MAX_PAGE_SIZE = 100;
/** Page sizes offered by the web app. */
export const PAGE_SIZES = [10, 20, 50] as const;
