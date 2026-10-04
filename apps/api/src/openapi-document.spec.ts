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

// The config module validates the environment as soon as AppModule is imported: set it in
// vi.hoisted (run before the imports) so that the test does not need a .env file. Real
// environment variables take precedence over .env, and the database is never queried.
vi.hoisted(() => {
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/openjobseekr';
  process.env.JWT_SECRET = 'a'.repeat(32);
  process.env.JWT_EXPIRES_IN = '1d';
});

describe('OpenAPI document', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await NestFactory.create(AppModule, { logger: false });
  });

  afterAll(async () => {
    await app.close();
  });

  it('matches the copy used by the web app (run `npm run api:types` after a DTO change)', () => {
    const document: unknown = JSON.parse(JSON.stringify(createOpenApiDocument(app)));
    const committed: unknown = JSON.parse(readFileSync(WEB_OPENAPI_PATH, 'utf8'));

    expect(document).toEqual(committed);
  });
});
