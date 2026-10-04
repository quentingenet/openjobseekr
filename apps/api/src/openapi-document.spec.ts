import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from './app.module.js';
import { createOpenApiDocument } from './app.setup.js';

// The web app compiles against this committed copy: a DTO change without `npm run api:types`
// would otherwise leave it on a stale contract while every check stays green.
const WEB_OPENAPI_PATH = new URL('../../web/src/api/openapi.json', import.meta.url);

describe('OpenAPI document', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Real environment variables take precedence over .env: the test does not depend on it.
    // The database is never queried: building the document only reads decorator metadata.
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/openjobseekr');
    vi.stubEnv('JWT_SECRET', 'a'.repeat(32));
    vi.stubEnv('JWT_EXPIRES_IN', '1d');
    app = await NestFactory.create(AppModule, { logger: false });
  });

  afterAll(async () => {
    await app.close();
    vi.unstubAllEnvs();
  });

  it('matches the copy used by the web app (run `npm run api:types` after a DTO change)', () => {
    const document: unknown = JSON.parse(JSON.stringify(createOpenApiDocument(app)));
    const committed: unknown = JSON.parse(readFileSync(WEB_OPENAPI_PATH, 'utf8'));

    expect(document).toEqual(committed);
  });
});
