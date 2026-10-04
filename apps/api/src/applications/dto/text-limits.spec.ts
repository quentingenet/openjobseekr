import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getMetadataStorage } from 'class-validator';
import { SKILL_LEVEL, SKILL_LIMITS, TEXT_LIMITS } from '@openjobseekr/domain';
import { CreateSkillDto, UpdateSkillDto } from '../../skills/dto/skill-input.dto.js';
import { CreateApplicationDto, UpdateApplicationDto } from './application-input.dto.js';

const migrationsDir = new URL('../../../prisma/migrations/', import.meta.url);

/** The SQL of every migration, concatenated. */
function allMigrations(): string {
  return readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readFileSync(new URL(`${entry.name}/migration.sql`, migrationsDir), 'utf8'))
    .join('\n');
}

/** `CHECK (char_length("field") <= N)` or `BETWEEN 1 AND N` from every migration. */
function databaseLimits(table: 'Application' | 'Skill'): Record<string, number> {
  const sql = allMigrations();
  const pattern = new RegExp(
    `"${table}_(\\w+)_length" CHECK \\(char_length\\("\\w+"\\) (?:<= (\\d+)|BETWEEN \\d+ AND (\\d+))\\)`,
    'g',
  );
  return Object.fromEntries(
    [...sql.matchAll(pattern)].map((match) => [match[1], Number(match[2] ?? match[3])]),
  );
}

/** `CHECK ("level" BETWEEN min AND max)` of the Skill table. */
function databaseLevelRange(): { min: number; max: number } | undefined {
  const match = /"Skill_level_range" CHECK \("level" BETWEEN (\d+) AND (\d+)\)/.exec(
    allMigrations(),
  );
  return match ? { min: Number(match[1]), max: Number(match[2]) } : undefined;
}

/** Value of the `rule` constraint (e.g. `min`, `max`) on `property` of the DTO. */
function apiConstraint(dto: new () => object, property: string, rule: string): number {
  const metadata = getMetadataStorage().getTargetValidationMetadatas(dto, '', true, false);
  return Number(
    metadata.find((item) => item.propertyName === property && item.name === rule)?.constraints[0],
  );
}

/** `@MaxLength(N)` of every field of the create DTO. */
function apiLimits(dto: new () => object): Record<string, number> {
  const metadata = getMetadataStorage().getTargetValidationMetadatas(dto, '', true, false);
  return Object.fromEntries(
    metadata
      .filter((rule) => rule.name === 'maxLength')
      .map((rule) => [rule.propertyName, Number(rule.constraints[0])]),
  );
}

describe('text length limits', () => {
  it('are the shared limits in the API validation and the database CHECK constraints', () => {
    expect(apiLimits(CreateApplicationDto)).toEqual(TEXT_LIMITS);
    expect(databaseLimits('Application')).toEqual(TEXT_LIMITS);
  });

  it('are the same in the update DTOs, which redeclare some fields', () => {
    expect(apiLimits(UpdateApplicationDto)).toEqual(TEXT_LIMITS);
    expect(apiLimits(UpdateSkillDto)).toEqual(SKILL_LIMITS);
  });

  it('are the same for skills', () => {
    expect(apiLimits(CreateSkillDto)).toEqual(SKILL_LIMITS);
    expect(databaseLimits('Skill')).toEqual(SKILL_LIMITS);
  });

  it('use the shared skill level range in the API validation and the database', () => {
    expect({
      min: apiConstraint(CreateSkillDto, 'level', 'min'),
      max: apiConstraint(CreateSkillDto, 'level', 'max'),
    }).toEqual(SKILL_LEVEL);
    expect(databaseLevelRange()).toEqual(SKILL_LEVEL);
  });
});
