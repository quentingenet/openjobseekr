import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getMetadataStorage } from 'class-validator';
import { CreateSkillDto, SKILL_LIMITS } from '../../skills/dto/skill-input.dto.js';
import { CreateApplicationDto } from './application-input.dto.js';

const migrationsDir = new URL('../../../prisma/migrations/', import.meta.url);

/** `CHECK (char_length("field") <= N)` or `BETWEEN 1 AND N` from every migration. */
function databaseLimits(table: 'Application' | 'Skill'): Record<string, number> {
  const sql = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readFileSync(new URL(`${entry.name}/migration.sql`, migrationsDir), 'utf8'))
    .join('\n');
  const pattern = new RegExp(
    `"${table}_(\\w+)_length" CHECK \\(char_length\\("\\w+"\\) (?:<= (\\d+)|BETWEEN \\d+ AND (\\d+))\\)`,
    'g',
  );
  return Object.fromEntries(
    [...sql.matchAll(pattern)].map((match) => [match[1], Number(match[2] ?? match[3])]),
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
  it('are the same in the database CHECK constraints and the API validation', () => {
    expect(Object.keys(apiLimits(CreateApplicationDto))).toHaveLength(14);
    expect(databaseLimits('Application')).toEqual(apiLimits(CreateApplicationDto));
  });

  it('are the same for skills', () => {
    expect(apiLimits(CreateSkillDto)).toEqual(SKILL_LIMITS);
    expect(databaseLimits('Skill')).toEqual(SKILL_LIMITS);
  });
});
