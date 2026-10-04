/**
 * Maximum text lengths, identical to the API's `TEXT_LIMITS`.
 * `limits.spec.ts` checks them against the OpenAPI document so they cannot drift apart.
 */
export const TEXT_LIMITS = {
  company: 200,
  jobTitle: 200,
  location: 200,
  response: 1_000,
  resources: 1_000,
  contact: 200,
  remoteRhythm: 200,
  salaryRange: 200,
  cvVersion: 200,
  stack: 1_000,
  recruitmentProcess: 10_000,
  notes: 10_000,
  jobPostingText: 50_000,
} as const;

export type TextField = keyof typeof TEXT_LIMITS;
