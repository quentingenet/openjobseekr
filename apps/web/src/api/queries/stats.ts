import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../client';
import { queryKeys } from '../query-keys';
import type { StatsOverview } from '../types';

export function useStatsOverview() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: ({ signal }) => apiRequest<StatsOverview>('GET', '/stats/overview', { signal }),
  });
}
