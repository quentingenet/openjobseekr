import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '../client';
import { queryKeys } from '../query-keys';
import type {
  ApplicationSummary,
  CreateApplicationInput,
  ListApplicationsQuery,
  UpdateApplicationInput,
} from '../types';

export function useApplications(query: ListApplicationsQuery) {
  return useQuery({
    queryKey: queryKeys.applicationList(query),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET('/applications', {
          // Empty filters are left out of the URL.
          params: {
            query: { ...query, q: query.q || undefined, overdue: query.overdue || undefined },
          },
          signal,
        }),
      ),
    // Keeps the current page visible while the next one loads.
    placeholderData: keepPreviousData,
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: queryKeys.application(id),
    queryFn: ({ signal }) =>
      unwrap(api.GET('/applications/{id}', { params: { path: { id } }, signal })),
  });
}

/**
 * Data derived from applications: statistics, and skill frequencies (computed from the job
 * posting texts).
 */
function useInvalidateDerivedData() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.stats }),
      queryClient.invalidateQueries({ queryKey: queryKeys.skills }),
    ]);
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  const invalidateDerived = useInvalidateDerivedData();
  return useMutation({
    mutationFn: (input: CreateApplicationInput) =>
      unwrap(api.POST('/applications', { body: input })),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.applicationLists }),
        invalidateDerived(),
      ]),
  });
}

/** Every application query (lists and details) and the data derived from them. */
function useInvalidateAfterChange() {
  const queryClient = useQueryClient();
  const invalidateDerived = useInvalidateDerivedData();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.applications }),
      invalidateDerived(),
    ]);
}

export function useUpdateApplication(id: string) {
  const invalidate = useInvalidateAfterChange();
  return useMutation({
    mutationFn: (input: UpdateApplicationInput) =>
      unwrap(api.PATCH('/applications/{id}', { params: { path: { id } }, body: input })),
    onSuccess: invalidate,
  });
}

/** Records that the user followed up today: the API schedules the next follow-up. */
export function useRecordFollowUp() {
  const invalidate = useInvalidateAfterChange();
  return useMutation({
    mutationFn: (id: string) =>
      unwrap(api.POST('/applications/{id}/follow-ups', { params: { path: { id } } })),
    onSuccess: invalidate,
  });
}

/** Puts back the follow-up date and count of before a recorded follow-up (undo). */
export function useRestoreFollowUp() {
  const invalidate = useInvalidateAfterChange();
  return useMutation({
    mutationFn: ({
      id,
      ...followUp
    }: Pick<ApplicationSummary, 'id' | 'followUpOverride' | 'followUpCount'>) =>
      unwrap(api.PATCH('/applications/{id}', { params: { path: { id } }, body: followUp })),
    onSuccess: invalidate,
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();
  const invalidateDerived = useInvalidateDerivedData();
  return useMutation({
    mutationFn: (id: string) =>
      unwrap(api.DELETE('/applications/{id}', { params: { path: { id } } })),
    // Not awaited, and lists only: refetching the deleted application's detail (still on
    // screen until the page navigates away) would show a 404.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.applicationLists });
      void invalidateDerived();
    },
  });
}
