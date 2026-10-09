import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { registerUser } from './helpers/auth.js';
import { createTestApp, resetDatabase } from './helpers/create-app.js';

// "Today" is fixed so that follow-up dates and the overdue filter are deterministic.
const TODAY = '2026-10-09';
const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

describe('Applications (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp({ today: TODAY }));
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    token = await registerUser(app, 'jane@example.com');
  });

  afterAll(async () => {
    await app.close();
  });

  const api = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${token}` });

  async function create(body: Record<string, unknown>, bearer = token): Promise<{ id: string }> {
    const response = await api()
      .post('/applications')
      .set('Authorization', `Bearer ${bearer}`)
      .send(body)
      .expect(201);
    return response.body as { id: string };
  }

  describe('CRUD', () => {
    it('creates an application with defaults and computed follow-up fields', async () => {
      const response = await api()
        .post('/applications')
        .set(auth())
        .send({
          sentAt: '2026-10-01',
          company: '  Acme  ',
          jobTitle: 'Backend developer',
          channel: 'LINKEDIN',
          location: '   ',
          jobPostingText: 'We are hiring a backend developer.',
        })
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(String),
        sentAt: '2026-10-01',
        company: 'Acme',
        jobTitle: 'Backend developer',
        location: null,
        response: null,
        resources: null,
        channel: 'LINKEDIN',
        channelDetail: null,
        status: 'SENT',
        contact: null,
        followUpDate: '2026-10-08',
        followUpOverride: null,
        followUpOverdue: true,
        followUpCount: 0,
        workMode: null,
        remoteRhythm: null,
        salaryRange: null,
        cvVersion: null,
        stack: null,
        recruitmentProcess: null,
        notes: null,
        jobPostingText: 'We are hiring a backend developer.',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(response.body).not.toHaveProperty('userId');
    });

    it('returns the detail with the job posting text', async () => {
      const { id } = await create({
        sentAt: '2026-10-03',
        company: 'Acme',
        jobTitle: 'Dev',
        jobPostingText: 'Full text',
      });

      const response = await api().get(`/applications/${id}`).set(auth()).expect(200);

      expect(response.body.jobPostingText).toBe('Full text');
      expect(response.body.followUpDate).toBe('2026-10-10');
      expect(response.body.followUpOverdue).toBe(false);
    });

    it('updates some fields, clears an optional one and removes the follow-up date', async () => {
      const { id } = await create({
        sentAt: '2026-10-01',
        company: 'Acme',
        jobTitle: 'Dev',
        notes: 'Call back',
      });

      const response = await api()
        .patch(`/applications/${id}`)
        .set(auth())
        .send({ status: 'HR_INTERVIEW', notes: null, contact: 'Marie Martin' })
        .expect(200);

      expect(response.body).toMatchObject({
        company: 'Acme',
        status: 'HR_INTERVIEW',
        notes: null,
        contact: 'Marie Martin',
        followUpDate: null,
        followUpOverdue: false,
      });
    });

    it('refuses to clear a required field', async () => {
      const { id } = await create({ sentAt: '2026-10-01', company: 'Acme', jobTitle: 'Dev' });

      const response = await api()
        .patch(`/applications/${id}`)
        .set(auth())
        .send({ company: null, status: null })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.errors).toEqual([
        { field: 'company', constraints: ['isNotEmpty', 'isString', 'maxLength'] },
        { field: 'status', constraints: ['isEnum'] },
      ]);
    });

    it('deletes an application', async () => {
      const { id } = await create({ sentAt: '2026-10-01', company: 'Acme', jobTitle: 'Dev' });

      await api().delete(`/applications/${id}`).set(auth()).expect(204);

      const response = await api().get(`/applications/${id}`).set(auth()).expect(404);
      expect(response.body).toEqual({
        type: 'urn:openjobseekr:error:application-not-found',
        title: 'Application not found',
        status: 404,
        instance: `/applications/${id}`,
        code: 'APPLICATION_NOT_FOUND',
      });
    });

    it('returns 404 for an unknown id and 400 for a malformed id', async () => {
      await api().patch(`/applications/${UNKNOWN_ID}`).set(auth()).send({}).expect(404);
      await api().delete(`/applications/${UNKNOWN_ID}`).set(auth()).expect(404);

      const response = await api().get('/applications/not-a-uuid').set(auth()).expect(400);
      expect(response.body).toMatchObject({
        status: 400,
        code: 'VALIDATION_FAILED',
        errors: [{ field: 'id', constraints: ['isUuid'] }],
      });
    });
  });

  describe('follow-up date set by the user', () => {
    it('replaces the computed date until it is cleared', async () => {
      const { id } = await create({
        sentAt: '2026-10-01',
        company: 'Acme',
        jobTitle: 'Dev',
        followUpOverride: '2026-10-20',
      });

      const detail = await api().get(`/applications/${id}`).set(auth()).expect(200);
      expect(detail.body).toMatchObject({
        followUpDate: '2026-10-20',
        followUpOverride: '2026-10-20',
        followUpOverdue: false,
      });

      const cleared = await api()
        .patch(`/applications/${id}`)
        .set(auth())
        .send({ followUpOverride: null })
        .expect(200);
      expect(cleared.body).toMatchObject({
        followUpDate: '2026-10-08',
        followUpOverride: null,
        followUpOverdue: true,
      });
    });

    it('is kept but unused once an answer is received', async () => {
      const { id } = await create({
        sentAt: '2026-10-01',
        company: 'Acme',
        jobTitle: 'Dev',
        status: 'REJECTED',
        followUpOverride: '2026-10-20',
      });

      const detail = await api().get(`/applications/${id}`).set(auth()).expect(200);
      expect(detail.body).toMatchObject({
        followUpDate: null,
        followUpOverride: '2026-10-20',
        followUpOverdue: false,
      });
    });

    it('rejects an impossible date', async () => {
      const response = await api()
        .post('/applications')
        .set(auth())
        .send({
          sentAt: '2026-10-01',
          company: 'Acme',
          jobTitle: 'Dev',
          followUpOverride: '2026-02-30',
        })
        .expect(400);

      expect(response.body.errors).toEqual([
        { field: 'followUpOverride', constraints: ['isCalendarDate'] },
      ]);
    });
  });

  describe('recording a follow-up', () => {
    const followUp = (id: string, headers = auth()) =>
      api().post(`/applications/${id}/follow-ups`).set(headers);

    it('counts the follow-up and schedules the next one a delay after today, no longer overdue', async () => {
      const { id } = await create({ sentAt: '2026-10-01', company: 'Acme', jobTitle: 'Dev' });

      const first = await followUp(id).expect(200);
      expect(first.body).toMatchObject({
        id,
        status: 'SENT',
        followUpDate: '2026-10-16',
        followUpOverride: '2026-10-16',
        followUpOverdue: false,
        followUpCount: 1,
      });
      const second = await followUp(id).expect(200);
      expect(second.body.followUpCount).toBe(2);

      const overdue = await api().get('/applications?overdue=true').set(auth()).expect(200);
      expect(overdue.body).toMatchObject({ items: [], total: 0 });
      const list = await api().get('/applications').set(auth()).expect(200);
      expect(list.body.items[0].followUpCount).toBe(2);
    });

    it('is undone by putting back the previous date and count', async () => {
      const { id } = await create({ sentAt: '2026-10-01', company: 'Acme', jobTitle: 'Dev' });
      await followUp(id).expect(200);

      const undone = await api()
        .patch(`/applications/${id}`)
        .set(auth())
        .send({ followUpOverride: null, followUpCount: 0 })
        .expect(200);
      expect(undone.body).toMatchObject({
        followUpDate: '2026-10-08',
        followUpOverdue: true,
        followUpCount: 0,
      });
    });

    it('accepts a count on creation, e.g. from an application followed up elsewhere', async () => {
      const { id } = await create({
        sentAt: '2026-10-01',
        company: 'Acme',
        jobTitle: 'Dev',
        followUpCount: 3,
      });

      const response = await followUp(id).expect(200);
      expect(response.body.followUpCount).toBe(4);
    });

    it('rejects a count out of range or null', async () => {
      const { id } = await create({ sentAt: '2026-10-01', company: 'Acme', jobTitle: 'Dev' });

      for (const followUpCount of [-1, 100, 1.5, null]) {
        const response = await api()
          .patch(`/applications/${id}`)
          .set(auth())
          .send({ followUpCount })
          .expect(400);
        expect(response.body.errors).toEqual([
          { field: 'followUpCount', constraints: expect.any(Array) as unknown },
        ]);
      }
    });

    it('refuses an application that is no longer waiting for an answer', async () => {
      const { id } = await create({
        sentAt: '2026-10-01',
        company: 'Acme',
        jobTitle: 'Dev',
        status: 'REJECTED',
      });

      const response = await followUp(id).expect(409);
      expect(response.body).toEqual({
        type: 'urn:openjobseekr:error:follow-up-not-expected',
        title: 'Application not waiting for an answer',
        status: 409,
        instance: `/applications/${id}/follow-ups`,
        code: 'FOLLOW_UP_NOT_EXPECTED',
      });
      const detail = await api().get(`/applications/${id}`).set(auth()).expect(200);
      expect(detail.body.followUpOverride).toBeNull();
    });

    it('returns 404 for an unknown id, 400 for a malformed id and 401 without a token', async () => {
      const missing = await followUp(UNKNOWN_ID).expect(404);
      expect(missing.body.code).toBe('APPLICATION_NOT_FOUND');

      const malformed = await followUp('not-a-uuid').expect(400);
      expect(malformed.body).toMatchObject({
        code: 'VALIDATION_FAILED',
        errors: [{ field: 'id', constraints: ['isUuid'] }],
      });

      await api().post(`/applications/${UNKNOWN_ID}/follow-ups`).expect(401);
    });
  });

  describe('channel precision for OTHER', () => {
    it('stores a precision with the OTHER channel and clears it when the channel changes', async () => {
      const { id } = await create({
        sentAt: '2026-10-01',
        company: 'Acme',
        jobTitle: 'Dev',
        channel: 'OTHER',
        channelDetail: '  Monster ',
      });
      const detail = await api().get(`/applications/${id}`).set(auth()).expect(200);
      expect(detail.body).toMatchObject({ channel: 'OTHER', channelDetail: 'Monster' });

      const updated = await api()
        .patch(`/applications/${id}`)
        .set(auth())
        .send({ channel: 'LINKEDIN' })
        .expect(200);

      expect(updated.body).toMatchObject({ channel: 'LINKEDIN', channelDetail: null });
    });

    it('rejects a precision without the OTHER channel', async () => {
      const response = await api()
        .post('/applications')
        .set(auth())
        .send({
          sentAt: '2026-10-01',
          company: 'Acme',
          jobTitle: 'Dev',
          channel: 'APEC',
          channelDetail: 'Monster',
        })
        .expect(400);

      expect(response.body.errors).toEqual([
        { field: 'channelDetail', constraints: ['requiresOtherChannel'] },
      ]);
    });
  });

  describe('validation', () => {
    it('rejects missing required fields, impossible dates, unknown enums and extra fields', async () => {
      const response = await api()
        .post('/applications')
        .set(auth())
        .send({ sentAt: '2026-02-30', company: '', channel: 'TWITTER', userId: 'someone-else' })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.errors).toEqual([
        { field: 'userId', constraints: ['whitelistValidation'] },
        { field: 'sentAt', constraints: ['isCalendarDate'] },
        { field: 'company', constraints: ['isNotEmpty'] },
        { field: 'jobTitle', constraints: ['isNotEmpty', 'isString', 'maxLength'] },
        { field: 'channel', constraints: ['isEnum'] },
      ]);
    });

    it('rejects a too long job posting text', async () => {
      const response = await api()
        .post('/applications')
        .set(auth())
        .send({
          sentAt: '2026-10-01',
          company: 'Acme',
          jobTitle: 'Dev',
          jobPostingText: 'a'.repeat(50_001),
        })
        .expect(400);

      expect(response.body.errors).toEqual([
        { field: 'jobPostingText', constraints: ['maxLength'] },
      ]);
    });

    it('accepts a body above the 100 kB Express default (long multibyte posting text)', async () => {
      // 50,000 characters of 'é' = 100,000 bytes, plus the other fields.
      const jobPostingText = 'é'.repeat(50_000);

      const response = await api()
        .post('/applications')
        .set(auth())
        .send({ sentAt: '2026-10-01', company: 'Acme', jobTitle: 'Dev', jobPostingText })
        .expect(201);

      expect(response.body.jobPostingText).toHaveLength(50_000);
    });

    it('rejects a body above 1 MB with 413 PAYLOAD_TOO_LARGE', async () => {
      const response = await api()
        .post('/applications')
        .set(auth())
        .send({
          sentAt: '2026-10-01',
          company: 'Acme',
          jobTitle: 'Dev',
          notes: 'a'.repeat(1_100_000),
        })
        .expect(413);

      expect(response.body).toEqual({
        type: 'urn:openjobseekr:error:payload-too-large',
        title: 'Request body too large',
        status: 413,
        instance: '/applications',
        code: 'PAYLOAD_TOO_LARGE',
      });
    });

    it('rejects an offset beyond the supported range', async () => {
      const response = await api()
        .get('/applications?offset=1000000000000')
        .set(auth())
        .expect(400);

      expect(response.body.errors).toEqual([{ field: 'offset', constraints: ['max'] }]);
    });

    it('treats % and _ in the search as plain characters', async () => {
      await create({ sentAt: '2026-10-01', company: 'Acme', jobTitle: 'Dev' });
      await create({ sentAt: '2026-10-02', company: '100% Remote', jobTitle: 'Dev' });

      const percent = await api().get('/applications?q=%25').set(auth()).expect(200);
      const underscore = await api().get('/applications?q=_').set(auth()).expect(200);

      expect(percent.body.items.map((i: { company: string }) => i.company)).toEqual([
        '100% Remote',
      ]);
      expect(underscore.body.total).toBe(0);
    });

    it('requires a token', async () => {
      const response = await api().get('/applications').expect(401);

      expect(response.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await create({
        sentAt: '2026-10-01',
        company: 'Acme',
        jobTitle: 'Backend developer',
        channel: 'LINKEDIN',
        jobPostingText: 'Long text',
      });
      await create({
        sentAt: '2026-10-02',
        company: 'Globex',
        jobTitle: 'Frontend developer',
        channel: 'APEC',
      });
      await create({
        sentAt: '2026-10-03',
        company: 'Initech',
        jobTitle: 'Data engineer',
        channel: 'LINKEDIN',
        status: 'REJECTED',
      });
      await create({ sentAt: '2026-09-20', company: 'Umbrella', jobTitle: 'DevOps' });
    });

    const companies = (body: { items: { company: string }[] }) =>
      body.items.map((item) => item.company);

    it('lists newest first, without the job posting text', async () => {
      const response = await api().get('/applications').set(auth()).expect(200);

      expect(companies(response.body)).toEqual(['Initech', 'Globex', 'Acme', 'Umbrella']);
      expect(response.body).toMatchObject({ total: 4, limit: 20, offset: 0 });
      for (const item of response.body.items) {
        expect(item).not.toHaveProperty('jobPostingText');
      }
    });

    it('sorts by sent date, oldest first with order=asc', async () => {
      const response = await api().get('/applications?order=asc').set(auth()).expect(200);

      expect(companies(response.body)).toEqual(['Umbrella', 'Acme', 'Globex', 'Initech']);
    });

    it('filters by status and by channel', async () => {
      const byStatus = await api().get('/applications?status=REJECTED').set(auth()).expect(200);
      const byChannel = await api().get('/applications?channel=LINKEDIN').set(auth()).expect(200);

      expect(companies(byStatus.body)).toEqual(['Initech']);
      expect(companies(byChannel.body)).toEqual(['Initech', 'Acme']);
    });

    it('uses the follow-up date set by the user in the overdue filter', async () => {
      // Hoops would be overdue with the computed date (09-18), not with the user's (10-15);
      // Wayne is overdue only because of the user's date (10-05 instead of 10-12).
      await create({
        sentAt: '2026-09-11',
        company: 'Hoops',
        jobTitle: 'Dev',
        followUpOverride: '2026-10-15',
      });
      await create({
        sentAt: '2026-10-05',
        company: 'Wayne',
        jobTitle: 'Dev',
        followUpOverride: '2026-10-05',
      });

      const response = await api().get('/applications?overdue=true').set(auth()).expect(200);

      expect(companies(response.body)).toEqual(['Wayne', 'Acme', 'Umbrella']);
    });

    it('filters overdue follow-ups (follow-up date before today, status SENT)', async () => {
      // Today 2026-10-09: Acme (follow-up 10-08) and Umbrella (09-27) are overdue,
      // Globex (10-09) is due today, Initech is rejected.
      const response = await api().get('/applications?overdue=true').set(auth()).expect(200);

      expect(companies(response.body)).toEqual(['Acme', 'Umbrella']);
      expect(
        response.body.items.map((i: { followUpOverdue: boolean }) => i.followUpOverdue),
      ).toEqual([true, true]);
    });

    it('searches company and job title, case-insensitively', async () => {
      const byCompany = await api().get('/applications?q=GLOB').set(auth()).expect(200);
      const byTitle = await api().get('/applications?q=developer').set(auth()).expect(200);

      expect(companies(byCompany.body)).toEqual(['Globex']);
      expect(companies(byTitle.body)).toEqual(['Globex', 'Acme']);
    });

    it('paginates with limit and offset, and returns the total', async () => {
      const response = await api().get('/applications?limit=2&offset=1').set(auth()).expect(200);

      expect(companies(response.body)).toEqual(['Globex', 'Acme']);
      expect(response.body).toMatchObject({ total: 4, limit: 2, offset: 1 });
    });

    it('rejects invalid query parameters', async () => {
      const response = await api()
        .get('/applications?limit=500&overdue=yes&status=WAITING&order=up')
        .set(auth())
        .expect(400);

      expect(response.body.errors).toEqual([
        { field: 'status', constraints: ['isEnum'] },
        { field: 'overdue', constraints: ['isBoolean'] },
        { field: 'order', constraints: ['isIn'] },
        { field: 'limit', constraints: ['max'] },
      ]);
    });
  });

  describe('ownership isolation', () => {
    it('never lets a user see, change or delete another user’s application', async () => {
      const { id } = await create({ sentAt: '2026-10-01', company: 'Acme', jobTitle: 'Dev' });
      const otherToken = await registerUser(app, 'john@example.com');
      const asOther = { Authorization: `Bearer ${otherToken}` };
      // Exactly the answer for a missing application: nothing reveals that it exists.
      const notFound = {
        type: 'urn:openjobseekr:error:application-not-found',
        title: 'Application not found',
        status: 404,
        instance: `/applications/${id}`,
        code: 'APPLICATION_NOT_FOUND',
      };

      const list = await api().get('/applications').set(asOther).expect(200);
      expect(list.body).toMatchObject({ items: [], total: 0 });

      expect((await api().get(`/applications/${id}`).set(asOther).expect(404)).body).toEqual(
        notFound,
      );
      expect(
        (
          await api()
            .patch(`/applications/${id}`)
            .set(asOther)
            .send({ company: 'Hacked' })
            .expect(404)
        ).body,
      ).toEqual(notFound);
      expect(
        (await api().post(`/applications/${id}/follow-ups`).set(asOther).expect(404)).body,
      ).toEqual({ ...notFound, instance: `/applications/${id}/follow-ups` });
      expect((await api().delete(`/applications/${id}`).set(asOther).expect(404)).body).toEqual(
        notFound,
      );

      const own = await api().get(`/applications/${id}`).set(auth()).expect(200);
      expect(own.body.company).toBe('Acme');
      expect(own.body).toMatchObject({ followUpOverride: null, followUpCount: 0 });
    });
  });
});
