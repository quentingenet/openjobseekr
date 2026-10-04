import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { registerUser } from './helpers/auth.js';
import { createTestApp, resetDatabase } from './helpers/create-app.js';

describe('Settings (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the follow-up delay from the configuration', async () => {
    const token = await registerUser(app, 'jane@example.com');

    const response = await request(app.getHttpServer())
      .get('/settings')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // FOLLOW_UP_DELAY_DAYS is set to 7 in vitest.config.e2e.ts.
    expect(response.body).toEqual({ followUpDelayDays: 7 });
  });

  it('requires a token', async () => {
    await request(app.getHttpServer()).get('/settings').expect(401);
  });
});
