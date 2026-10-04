import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './helpers/create-app.js';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('reports the database as up, without authentication', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    // responseTime is measured by Terminus, so only its type can be checked.
    const database = { status: 'up', responseTime: expect.any(Number) };
    expect(response.body).toEqual({
      status: 'ok',
      info: { database },
      error: {},
      details: { database },
    });
  });
});
