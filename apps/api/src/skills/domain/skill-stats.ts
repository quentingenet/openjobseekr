import { createSkillMatcher } from './skill-pattern.js';

export interface SkillInput {
  id: string;
  name: string;
  pattern: string;
  level: number | null;
}

export interface SkillStat extends SkillInput {
  postingCount: number;
  /** postingCount / postingsAnalyzed; null when no posting text was saved. */
  frequency: number | null;
}

export interface SkillStats {
  postingsAnalyzed: number;
  skills: SkillStat[];
}

/**
 * Like the "Compétences" sheet: only applications with a posting text are analysed.
 * Sorted by frequency (most requested first), then by name.
 */
export function computeSkillStats(
  skills: readonly SkillInput[],
  postings: readonly (string | null)[],
): SkillStats {
  const texts = postings.filter((text): text is string => text !== null && text.trim() !== '');
  const stats = skills.map((skill) => {
    const matches = createSkillMatcher(skill.pattern);
    const postingCount = texts.filter(matches).length;
    return {
      ...skill,
      postingCount,
      frequency: texts.length === 0 ? null : postingCount / texts.length,
    };
  });
  stats.sort((a, b) => (b.frequency ?? -1) - (a.frequency ?? -1) || a.name.localeCompare(b.name));
  return { postingsAnalyzed: texts.length, skills: stats };
}
