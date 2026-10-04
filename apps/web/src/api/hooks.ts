import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './client';
import type {
  Application,
  ApplicationList,
  AuthResponse,
  CreateApplicationInput,
  Credentials,
  ListApplicationsQuery,
  Settings,
  StatsOverview,
  UpdateApplicationInput,
} from './types';

export const queryKeys = {
  applications: ['applications'] as const,
  applicationList: (query: ListApplicationsQuery) => ['applications', 'list', query] as const,
  application: (id: string) => ['applications', 'detail', id] as const,
  stats: ['stats', 'overview'] as const,
  settings: ['settings'] as const,
};

export function useLogin() {
  return useMutation({
    mutationFn: (credentials: Credentials) =>
      apiRequest<AuthResponse>('POST', '/auth/login', { body: credentials }),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (credentials: Credentials) =>
      apiRequest<AuthResponse>('POST', '/auth/register', { body: credentials }),
  });
}

export function useApplications(query: ListApplicationsQuery) {
  return useQuery({
    queryKey: queryKeys.applicationList(query),
    queryFn: ({ signal }) =>
      apiRequest<ApplicationList>('GET', '/applications', {
        query: { ...query, overdue: query.overdue ? true : undefined },
        signal,
      }),
    // Keeps the current page visible while the next one loads.
    placeholderData: keepPreviousData,
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: queryKeys.application(id),
    queryFn: ({ signal }) => apiRequest<Application>('GET', `/applications/${id}`, { signal }),
  });
}

/** After any change, lists, details and statistics are refetched. */
function useInvalidateApplications() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.applications }),
      queryClient.invalidateQueries({ queryKey: queryKeys.stats }),
    ]);
}

export function useCreateApplication() {
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: (input: CreateApplicationInput) =>
      apiRequest<Application>('POST', '/applications', { body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdateApplication(id: string) {
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: (input: UpdateApplicationInput) =>
      apiRequest<Application>('PATCH', `/applications/${id}`, { body: input }),
    onSuccess: invalidate,
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest<undefined>('DELETE', `/applications/${id}`),
    // Only lists and stats: refetching the deleted application's detail (still on screen
    // until the page navigates away) would show a 404.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['applications', 'list'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
}

export function useStatsOverview() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: ({ signal }) => apiRequest<StatsOverview>('GET', '/stats/overview', { signal }),
  });
}

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: ({ signal }) => apiRequest<Settings>('GET', '/settings', { signal }),
    staleTime: Infinity,
  });
}
