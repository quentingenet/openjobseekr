import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, resetDatabase } from './helpers/create-app.js';

// The other e2e files raise the limit; this one lowers it before the config module is loaded.
vi.hoisted(() => {
  process.env.AUTH_RATE_LIMIT = '3';
});

describe('Auth rate limit (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  const wrongCredentials = { email: 'jane@example.com', password: 'wrong password' };

  it('rejects login attempts above the limit with 429 TOO_MANY_REQUESTS and Retry-After', async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      await request(app.getHttpServer()).post('/auth/login').send(wrongCredentials).expect(401);
    }

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(wrongCredentials)
      .expect(429);

    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(Number(response.headers['retry-after'])).toBeGreaterThan(0);
    expect(response.body).toEqual({
      type: 'urn:openjobseekr:error:too-many-requests',
      title: 'Too many requests',
      status: 429,
      detail: 'Too many attempts, try again later',
      instance: '/auth/login',
      code: 'TOO_MANY_REQUESTS',
    });
  });

  it('limits registrations separately from logins', async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: `user${attempt}@example.com`, password: 'correct horse battery' })
        .expect(201);
    }

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'user3@example.com', password: 'correct horse battery' })
      .expect(429);
  });

  it('does not limit the other routes', async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      await request(app.getHttpServer()).get('/health').expect(200);
    }
  });
});
