import { execFileSync } from 'node:child_process';

/** Applies the migrations to the e2e database once, before any test file runs. */
export default function setup(): void {
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TEST },
  });
}
