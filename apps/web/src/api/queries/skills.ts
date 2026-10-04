import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../client';
import { queryKeys } from '../query-keys';
import type { CreateSkillInput, Skill, SkillStats, UpdateSkillInput } from '../types';

export function useSkillStats() {
  return useQuery({
    queryKey: queryKeys.skills,
    queryFn: ({ signal }) => apiRequest<SkillStats>('GET', '/skills/stats', { signal }),
  });
}

function useInvalidateSkills() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.skills });
}

export function useCreateSkill() {
  const invalidate = useInvalidateSkills();
  return useMutation({
    mutationFn: (input: CreateSkillInput) => apiRequest<Skill>('POST', '/skills', { body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdateSkill() {
  const invalidate = useInvalidateSkills();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSkillInput }) =>
      apiRequest<Skill>('PATCH', `/skills/${id}`, { body: input }),
    onSuccess: invalidate,
  });
}

export function useDeleteSkill() {
  const invalidate = useInvalidateSkills();
  return useMutation({
    mutationFn: (id: string) => apiRequest<undefined>('DELETE', `/skills/${id}`),
    onSuccess: invalidate,
  });
}
