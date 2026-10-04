import type { components } from './schema';

type Schemas = components['schemas'];

export type Application = Schemas['ApplicationDetailDto'];
export type ApplicationSummary = Schemas['ApplicationSummaryDto'];
export type ApplicationList = Schemas['ApplicationListDto'];
export type CreateApplicationInput = Schemas['CreateApplicationDto'];
export type UpdateApplicationInput = Schemas['UpdateApplicationDto'];
export type AuthResponse = Schemas['AuthResponseDto'];
export type Credentials = Schemas['RegisterDto'];
export type StatsOverview = Schemas['StatsOverviewDto'];
export type Settings = Schemas['SettingsDto'];
export type Skill = Schemas['SkillDto'];
export type SkillStats = Schemas['SkillStatsDto'];
export type SkillStat = Schemas['SkillStatDto'];
export type CreateSkillInput = Schemas['CreateSkillDto'];
export type UpdateSkillInput = Schemas['UpdateSkillDto'];

export type ApplicationStatus = Application['status'];
export type ApplicationChannel = NonNullable<Application['channel']>;
export type WorkMode = NonNullable<Application['workMode']>;

// Enum values in the API order, for selects and statistics.
export const APPLICATION_STATUSES = [
  'SENT',
  'RESPONSE_RECEIVED',
  'HR_INTERVIEW',
  'TECHNICAL_INTERVIEW',
  'OFFER',
  'REJECTED',
  'NO_RESPONSE',
] as const satisfies readonly ApplicationStatus[];

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
] as const satisfies readonly ApplicationChannel[];

export const WORK_MODES = [
  'ONSITE',
  'HYBRID',
  'FULL_REMOTE',
  'UNSPECIFIED',
] as const satisfies readonly WorkMode[];

export interface ListApplicationsQuery {
  status?: ApplicationStatus;
  channel?: ApplicationChannel;
  overdue?: boolean;
  q?: string;
  /** By sent date; the API default is 'desc' (newest first). */
  order: 'asc' | 'desc';
  limit: number;
  offset: number;
}
