import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '../client';
import { queryKeys } from '../query-keys';
import type { CreateSkillInput, UpdateSkillInput } from '../types';

export function useSkillStats() {
  return useQuery({
    queryKey: queryKeys.skills,
    queryFn: ({ signal }) => unwrap(api.GET('/skills/stats', { signal })),
  });
}

function useInvalidateSkills() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.skills });
}

export function useCreateSkill() {
  const invalidate = useInvalidateSkills();
  return useMutation({
    mutationFn: (input: CreateSkillInput) => unwrap(api.POST('/skills', { body: input })),
    onSuccess: invalidate,
  });
}

export function useUpdateSkill() {
  const invalidate = useInvalidateSkills();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSkillInput }) =>
      unwrap(api.PATCH('/skills/{id}', { params: { path: { id } }, body: input })),
    onSuccess: invalidate,
  });
}

export function useDeleteSkill() {
  const invalidate = useInvalidateSkills();
  return useMutation({
    mutationFn: (id: string) => unwrap(api.DELETE('/skills/{id}', { params: { path: { id } } })),
    onSuccess: invalidate,
  });
}
