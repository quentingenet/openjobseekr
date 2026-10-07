import { skillNameKey } from '../../skills/domain/skill-name.js';
import type { ImportedSkill } from './parse-workbook.js';

/** A skill of the file left out because the user, or an earlier row, already has it. */
export interface IgnoredSkill {
  row: number;
  name: string;
  keptName: string;
}

/**
 * Skills are added, not replaced: the user's skills and their levels are kept, and a skill of
 * the file is only added when no existing skill and no earlier row has the same name (see
 * `skillNameKey`).
 */
export function selectNewSkills(
  existingNames: readonly string[],
  skills: readonly ImportedSkill[],
): { added: Omit<ImportedSkill, 'row'>[]; ignored: IgnoredSkill[] } {
  const known = new Map(existingNames.map((name) => [skillNameKey(name), name]));
  const added: Omit<ImportedSkill, 'row'>[] = [];
  const ignored: IgnoredSkill[] = [];
  for (const { row, ...skill } of skills) {
    const key = skillNameKey(skill.name);
    const keptName = known.get(key);
    if (keptName === undefined) {
      known.set(key, skill.name);
      added.push(skill);
    } else {
      ignored.push({ row, name: skill.name, keptName });
    }
  }
  return { added, ignored };
}
