import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../client';
import { queryKeys } from '../query-keys';
import type { Settings, StatsOverview } from '../types';

export function useStatsOverview() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: ({ signal }) => apiRequest<StatsOverview>('GET', '/stats/overview', { signal }),
  });
}

/** Server settings (e.g. follow-up delay); they only change when the API restarts. */
export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: ({ signal }) => apiRequest<Settings>('GET', '/settings', { signal }),
    staleTime: Infinity,
  });
}
