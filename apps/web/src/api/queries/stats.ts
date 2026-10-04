import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '../client';
import { queryKeys } from '../query-keys';

export function useStatsOverview() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: ({ signal }) => unwrap(api.GET('/stats/overview', { signal })),
  });
}
