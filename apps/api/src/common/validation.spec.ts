import type { ValidationError } from '@nestjs/common';
import { IsEmail } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { createValidationPipe, toFieldErrors } from './validation.js';
import { appError } from './testing/app-error.js';

describe('toFieldErrors', () => {
  it('lists the failed constraint names per field, including nested fields', () => {
    const errors: ValidationError[] = [
      { property: 'email', constraints: { isEmail: 'email must be an email' }, children: [] },
      {
        property: 'address',
        children: [
          {
            property: 'city',
            constraints: { isString: 'city must be a string', isNotEmpty: 'city is empty' },
            children: [],
          },
        ],
      },
    ];

    expect(toFieldErrors(errors)).toEqual([
      { field: 'email', constraints: ['isEmail'] },
      { field: 'address.city', constraints: ['isNotEmpty', 'isString'] },
    ]);
  });

  it('returns an empty list when there are no errors', () => {
    expect(toFieldErrors([])).toEqual([]);
  });
});

class SampleDto {
  @IsEmail()
  email: string;
}

describe('createValidationPipe', () => {
  const pipe = createValidationPipe();
  const metadata = { type: 'body', metatype: SampleDto } as const;

  it('throws a VALIDATION_FAILED AppException with field details', async () => {
    const error = await pipe
      .transform({ email: 'not-an-email' }, metadata)
      .catch((e: unknown) => e);

    expect(appError(error)).toEqual({
      code: 'VALIDATION_FAILED',
      status: 400,
      detail: undefined,
      errors: [{ field: 'email', constraints: ['isEmail'] }],
    });
  });

  it('rejects properties that are not declared in the DTO', async () => {
    const error = await pipe
      .transform({ email: 'jane@example.com', isAdmin: true }, metadata)
      .catch((e: unknown) => e);

    expect(appError(error).errors).toEqual([
      { field: 'isAdmin', constraints: ['whitelistValidation'] },
    ]);
  });

  it('returns an instance of the DTO class for a valid body', async () => {
    const result: unknown = await pipe.transform({ email: 'jane@example.com' }, metadata);

    expect(result).toBeInstanceOf(SampleDto);
    expect(result).toEqual({ email: 'jane@example.com' });
  });
});
