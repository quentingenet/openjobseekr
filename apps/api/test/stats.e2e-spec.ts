import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { registerUser } from './helpers/auth.js';
import { createTestApp, resetDatabase } from './helpers/create-app.js';

describe('Stats (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    token = await registerUser(app, 'jane@example.com');
  });

  afterAll(async () => {
    await app.close();
  });

  const overview = (bearer: string) =>
    request(app.getHttpServer()).get('/stats/overview').set('Authorization', `Bearer ${bearer}`);

  async function create(body: Record<string, unknown>, bearer: string): Promise<void> {
    await request(app.getHttpServer())
      .post('/applications')
      .set('Authorization', `Bearer ${bearer}`)
      .send({ sentAt: '2026-10-01', company: 'Acme', jobTitle: 'Dev', ...body })
      .expect(201);
  }

  it('returns zero counts and a null rate without applications', async () => {
    const response = await overview(token).expect(200);

    expect(response.body.total).toBe(0);
    expect(response.body.responseRate).toBeNull();
    expect(response.body.byStatus.SENT).toBe(0);
    expect(response.body.byChannel.UNSPECIFIED).toBe(0);
  });

  it('computes counts and response rate on a known dataset, for the current user only', async () => {
    await create({ status: 'SENT', channel: 'LINKEDIN' }, token);
    await create({ status: 'SENT', channel: 'LINKEDIN' }, token);
    await create({ status: 'NO_RESPONSE', channel: 'APEC' }, token);
    await create({ status: 'HR_INTERVIEW', channel: 'APEC' }, token);
    await create({ status: 'REJECTED' }, token);
    // Another user's data must not be counted.
    const otherToken = await registerUser(app, 'john@example.com');
    await create({ status: 'OFFER', channel: 'REFERRAL' }, otherToken);

    const response = await overview(token).expect(200);

    expect(response.body).toEqual({
      total: 5,
      byStatus: {
        SENT: 2,
        RESPONSE_RECEIVED: 0,
        HR_INTERVIEW: 1,
        TECHNICAL_INTERVIEW: 0,
        OFFER: 0,
        REJECTED: 1,
        NO_RESPONSE: 1,
      },
      byChannel: {
        CAREER_SITE: 0,
        LINKEDIN: 2,
        WELCOME_TO_THE_JUNGLE: 0,
        HELLOWORK: 0,
        APEC: 2,
        INDEED: 0,
        FREE_WORK: 0,
        LICORNE_SOCIETY: 0,
        RECRUITMENT_AGENCY: 0,
        UNSOLICITED: 0,
        REFERRAL: 0,
        OTHER: 0,
        UNSPECIFIED: 1,
      },
      responseRate: 0.4,
    });
  });

  it('requires a token', async () => {
    await request(app.getHttpServer()).get('/stats/overview').expect(401);
  });
});
