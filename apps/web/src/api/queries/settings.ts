import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '../client';
import { queryKeys } from '../query-keys';

/** Server settings (e.g. follow-up delay); they only change when the API restarts. */
export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: ({ signal }) => unwrap(api.GET('/settings', { signal })),
    staleTime: Infinity,
  });
}
