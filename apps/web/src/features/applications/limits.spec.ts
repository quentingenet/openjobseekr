import { SKILL_LIMITS, TEXT_LIMITS } from '@openjobseekr/domain';
import { describe, expect, it } from 'vitest';
import openapi from '../../api/openapi.json';

type Schemas = typeof openapi.components.schemas;

/** `maxLength` documented in the OpenAPI document (`@ApiProperty`), per field. */
function documentedLimits(dto: keyof Schemas): Record<string, number | undefined> {
  const properties = openapi.components.schemas[dto].properties as Record<
    string,
    { maxLength?: number }
  >;
  return Object.fromEntries(
    Object.entries(properties)
      .filter(([, schema]) => schema.maxLength !== undefined)
      .map(([field, schema]) => [field, schema.maxLength]),
  );
}

// The API tests check the validation (`@MaxLength`); these check what the API documents.
describe('documented text limits', () => {
  it('are the shared limits for applications', () => {
    expect(documentedLimits('CreateApplicationDto')).toEqual(TEXT_LIMITS);
  });

  it('are the shared limits for skills', () => {
    expect(documentedLimits('CreateSkillDto')).toEqual(SKILL_LIMITS);
  });
});
