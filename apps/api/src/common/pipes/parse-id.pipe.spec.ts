import { describe, expect, it } from 'vitest';
import { appError } from '../testing/app-error.js';
import { ParseIdPipe } from './parse-id.pipe.js';

const metadata = { type: 'param', data: 'id' } as const;

describe('ParseIdPipe', () => {
  it('accepts a UUID', async () => {
    const id = '6c3f4d2e-0000-4000-8000-000000000001';

    await expect(new ParseIdPipe().transform(id, metadata)).resolves.toBe(id);
  });

  it('rejects anything else with VALIDATION_FAILED on the id field', async () => {
    const error = await new ParseIdPipe().transform('42', metadata).catch((e: unknown) => e);

    expect(appError(error)).toEqual({
      code: 'VALIDATION_FAILED',
      status: 400,
      detail: undefined,
      errors: [{ field: 'id', constraints: ['isUuid'] }],
    });
  });
});
