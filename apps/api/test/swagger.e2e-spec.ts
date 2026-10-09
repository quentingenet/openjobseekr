import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { setupSwagger } from '../src/app.setup.js';
import { createTestApp } from './helpers/create-app.js';

describe('Swagger (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp({ beforeInit: setupSwagger }));
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves the UI at /docs', async () => {
    const response = await request(app.getHttpServer()).get('/docs').expect(200);

    expect(response.text).toContain('swagger-ui');
  });

  it('documents every route, with bearer authentication', async () => {
    const response = await request(app.getHttpServer()).get('/docs-json').expect(200);

    expect(Object.keys(response.body.paths).sort()).toEqual([
      '/applications',
      '/applications/{id}',
      '/applications/{id}/follow-ups',
      '/auth/login',
      '/auth/me',
      '/auth/register',
      '/export',
      '/health',
      '/import',
      '/settings',
      '/skills',
      '/skills/stats',
      '/skills/{id}',
      '/stats/overview',
    ]);
    expect(response.body.components.securitySchemes.bearer).toEqual({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
  });
});
