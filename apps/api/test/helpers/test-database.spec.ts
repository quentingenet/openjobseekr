import { describe, expect, it } from 'vitest';
import { assertSafeTestDatabaseUrl } from './test-database.js';

const devUrl = 'postgresql://u:p@localhost:5432/openjobseekr';

describe('assertSafeTestDatabaseUrl', () => {
  it('accepts a separate database whose name ends with _test', () => {
    const testUrl = 'postgresql://u:p@localhost:5432/openjobseekr_test';

    expect(assertSafeTestDatabaseUrl(testUrl, devUrl)).toBe(testUrl);
  });

  it('rejects a missing test URL', () => {
    expect(() => assertSafeTestDatabaseUrl(undefined, devUrl)).toThrow(
      'DATABASE_URL_TEST must be set to run e2e tests (see .env.example).',
    );
  });

  it('rejects the development database URL', () => {
    expect(() => assertSafeTestDatabaseUrl(devUrl, devUrl)).toThrow(
      'DATABASE_URL_TEST must not be the same as DATABASE_URL.',
    );
  });

  it('rejects a database name without the _test suffix', () => {
    expect(() =>
      assertSafeTestDatabaseUrl(
        'postgresql://u:p@localhost:5432/openjobseekr?schema=public',
        undefined,
      ),
    ).toThrow('The e2e database name must end with "_test" (got "openjobseekr")');
  });
});
