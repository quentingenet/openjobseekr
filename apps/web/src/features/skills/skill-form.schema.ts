import { z } from 'zod';
import type { Skill } from '../../api/types';

/**
 * Same limits as the API (`SKILL_LIMITS`). The browser checks JavaScript syntax; the API uses
 * RE2 and also rejects lookarounds and backreferences.
 */
export const SKILL_LIMITS = { name: 100, pattern: 200 } as const;

export function isValidRegex(pattern: string): boolean {
  try {
    new RegExp(pattern, 'i');
    return true;
  } catch {
    return false;
  }
}

export const skillFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .max(SKILL_LIMITS.name, 'validation.tooLong'),
  pattern: z
    .string()
    .refine((value) => value.trim() !== '', 'validation.required')
    .max(SKILL_LIMITS.pattern, 'validation.tooLong')
    .refine(isValidRegex, 'validation.regex'),
  /** '' = not rated. */
  level: z.union([z.literal(''), z.number().int().min(0).max(5)]),
});

export type SkillFormValues = z.input<typeof skillFormSchema>;

export function skillToForm(skill?: Skill): SkillFormValues {
  return { name: skill?.name ?? '', pattern: skill?.pattern ?? '', level: skill?.level ?? '' };
}

export function toSkillInput(values: z.output<typeof skillFormSchema>) {
  return {
    name: values.name,
    pattern: values.pattern,
    level: values.level === '' ? null : values.level,
  };
}
