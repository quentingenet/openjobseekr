/**
 * The e2e tests empty every table. Refuse to run them unless the test database is clearly
 * separate from the development one.
 */
export function assertSafeTestDatabaseUrl(
  testUrl: string | undefined,
  devUrl: string | undefined,
): string {
  if (!testUrl) {
    throw new Error('DATABASE_URL_TEST must be set to run e2e tests (see .env.example).');
  }
  if (testUrl === devUrl) {
    throw new Error('DATABASE_URL_TEST must not be the same as DATABASE_URL.');
  }
  const databaseName = new URL(testUrl).pathname.slice(1);
  if (!databaseName.endsWith('_test')) {
    throw new Error(
      `The e2e database name must end with "_test" (got "${databaseName}"): its tables are emptied.`,
    );
  }
  return testUrl;
}
