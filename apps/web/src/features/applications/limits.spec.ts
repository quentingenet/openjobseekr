import { TEXT_LIMITS } from '@openjobseekr/domain';
import { describe, expect, it } from 'vitest';
import openapi from '../../api/openapi.json';

describe('TEXT_LIMITS', () => {
  it('matches the maxLength of every text field in the API create DTO', () => {
    const properties = openapi.components.schemas.CreateApplicationDto.properties as Record<
      string,
      { maxLength?: number }
    >;
    const apiLimits = Object.fromEntries(
      Object.entries(properties)
        .filter(([, schema]) => schema.maxLength !== undefined)
        .map(([field, schema]) => [field, schema.maxLength]),
    );

    expect(apiLimits).toEqual(TEXT_LIMITS);
  });
});
