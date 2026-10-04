import type { ListApplicationsQuery } from './types';

/** TanStack Query cache keys, shared so that mutations invalidate the right queries. */
export const queryKeys = {
  applications: ['applications'] as const,
  applicationLists: ['applications', 'list'] as const,
  applicationList: (query: ListApplicationsQuery) => ['applications', 'list', query] as const,
  application: (id: string) => ['applications', 'detail', id] as const,
  stats: ['stats', 'overview'] as const,
  settings: ['settings'] as const,
  skills: ['skills'] as const,
};
