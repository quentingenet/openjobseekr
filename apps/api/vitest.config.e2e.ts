import { existsSync } from 'node:fs';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import { assertSafeTestDatabaseUrl } from './test/helpers/test-database.js';

const rootEnvFile = new URL('../../.env', import.meta.url);
if (existsSync(rootEnvFile)) {
  process.loadEnvFile(rootEnvFile);
}

const testDatabaseUrl = assertSafeTestDatabaseUrl(
  process.env.DATABASE_URL_TEST,
  process.env.DATABASE_URL,
);

export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['test/**/*.e2e-spec.ts'],
    environment: 'node',
    // Test files share one database: run them one after the other.
    fileParallelism: false,
    globalSetup: ['test/global-setup.ts'],
    env: {
      DATABASE_URL: testDatabaseUrl,
      // Expected follow-up dates in the tests assume a 7-day delay.
      FOLLOW_UP_DELAY_DAYS: '7',
    },
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
