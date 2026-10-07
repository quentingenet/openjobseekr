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
export type ImportResult = Schemas['ImportResultDto'];

export type ApplicationStatus = Application['status'];
export type ApplicationChannel = NonNullable<Application['channel']>;
export type WorkMode = NonNullable<Application['workMode']>;

// The value lists (for selects and statistics) come from @openjobseekr/domain.

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
