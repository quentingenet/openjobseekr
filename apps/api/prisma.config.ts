import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// Prisma 7 no longer loads .env files: load the repository root .env when present.
const rootEnvFile = new URL('../../.env', import.meta.url);
if (existsSync(rootEnvFile)) {
  process.loadEnvFile(rootEnvFile);
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  // Optional here so that `prisma generate` works without a database; migrate commands
  // fail with a clear Prisma error when DATABASE_URL is missing.
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
