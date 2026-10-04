import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { registerUser } from './helpers/auth.js';
import { createTestApp, resetDatabase } from './helpers/create-app.js';

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

describe('Skills (e2e)', () => {
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

  const api = () => request(app.getHttpServer());
  const auth = (bearer = token) => ({ Authorization: `Bearer ${bearer}` });

  async function createSkill(body: Record<string, unknown>, bearer = token) {
    const response = await api().post('/skills').set(auth(bearer)).send(body).expect(201);
    return response.body as { id: string };
  }

  async function createApplication(jobPostingText: string | null) {
    await api()
      .post('/applications')
      .set(auth())
      .send({ sentAt: '2026-10-01', company: 'Acme', jobTitle: 'Dev', jobPostingText })
      .expect(201);
  }

  describe('CRUD', () => {
    it('creates, lists by name, updates and deletes a skill', async () => {
      const { id } = await createSkill({
        name: '  TypeScript ',
        pattern: '\\bTypeScript\\b',
        level: 3,
      });
      await createSkill({ name: 'Java', pattern: '\\bJava\\b' });

      const list = await api().get('/skills').set(auth()).expect(200);
      expect(list.body).toEqual([
        { id: expect.any(String), name: 'Java', pattern: '\\bJava\\b', level: null },
        { id, name: 'TypeScript', pattern: '\\bTypeScript\\b', level: 3 },
      ]);

      const updated = await api()
        .patch(`/skills/${id}`)
        .set(auth())
        .send({ level: null, pattern: '\\bTS\\b|TypeScript' })
        .expect(200);
      expect(updated.body).toEqual({
        id,
        name: 'TypeScript',
        pattern: '\\bTS\\b|TypeScript',
        level: null,
      });

      await api().delete(`/skills/${id}`).set(auth()).expect(204);
      await api().delete(`/skills/${id}`).set(auth()).expect(404);
    });

    it('rejects a duplicate name for the same user (409 SKILL_NAME_ALREADY_USED)', async () => {
      await createSkill({ name: 'React', pattern: 'React' });

      const response = await api()
        .post('/skills')
        .set(auth())
        .send({ name: 'React', pattern: 'react' })
        .expect(409);

      expect(response.body).toEqual({
        type: 'urn:openjobseekr:error:skill-name-already-used',
        title: 'Skill name already used',
        status: 409,
        instance: '/skills',
        code: 'SKILL_NAME_ALREADY_USED',
      });
    });

    it('returns SKILL_NOT_FOUND for an unknown id', async () => {
      const response = await api()
        .patch(`/skills/${UNKNOWN_ID}`)
        .set(auth())
        .send({ level: 1 })
        .expect(404);

      expect(response.body).toEqual({
        type: 'urn:openjobseekr:error:skill-not-found',
        title: 'Skill not found',
        status: 404,
        instance: `/skills/${UNKNOWN_ID}`,
        code: 'SKILL_NOT_FOUND',
      });
    });
  });

  describe('validation', () => {
    it('rejects an invalid regular expression', async () => {
      const response = await api()
        .post('/skills')
        .set(auth())
        .send({ name: 'Broken', pattern: '(unclosed' })
        .expect(400);

      expect(response.body).toMatchObject({
        status: 400,
        code: 'VALIDATION_FAILED',
        errors: [{ field: 'pattern', constraints: ['isRegex'] }],
      });
    });

    it('accepts nested repetitions and still computes stats quickly (RE2, no ReDoS)', async () => {
      await createSkill({ name: 'Nested', pattern: '(a+)+$' });
      await createApplication(`${'a'.repeat(40_000)}!`);
      const start = performance.now();

      const response = await api().get('/skills/stats').set(auth()).expect(200);

      expect(performance.now() - start).toBeLessThan(2_000);
      expect(response.body.skills[0].postingCount).toBe(0);
    });

    it('rejects a lookahead, which RE2 does not support', async () => {
      const response = await api()
        .post('/skills')
        .set(auth())
        .send({ name: 'Look', pattern: 'a(?=b)' })
        .expect(400);

      expect(response.body.errors).toEqual([{ field: 'pattern', constraints: ['isRegex'] }]);
    });

    it('rejects a level outside 0-5 and clearing the name', async () => {
      const { id } = await createSkill({ name: 'Rust', pattern: 'Rust' });

      const create = await api()
        .post('/skills')
        .set(auth())
        .send({ name: 'Go', pattern: '\\bGo\\b', level: 6 })
        .expect(400);
      const update = await api()
        .patch(`/skills/${id}`)
        .set(auth())
        .send({ name: null })
        .expect(400);

      expect(create.body.errors).toEqual([{ field: 'level', constraints: ['max'] }]);
      expect(update.body.errors).toEqual([
        { field: 'name', constraints: ['isNotEmpty', 'isString', 'maxLength'] },
      ]);
    });
  });

  describe('stats', () => {
    it('counts the postings per skill, with word boundaries, over postings that have a text', async () => {
      await createSkill({ name: 'Java', pattern: '\\bJava\\b' });
      await createSkill({ name: 'SQL', pattern: '\\bSQL\\b' });
      await createSkill({ name: 'TypeScript', pattern: '\\bTypeScript\\b', level: 4 });
      await createApplication('Frontend JavaScript and TypeScript, NoSQL database');
      await createApplication('Backend Java and SQL');
      await createApplication('typescript everywhere');
      await createApplication(null);

      const response = await api().get('/skills/stats').set(auth()).expect(200);

      expect(response.body).toEqual({
        postingsAnalyzed: 3,
        skills: [
          {
            id: expect.any(String),
            name: 'TypeScript',
            pattern: '\\bTypeScript\\b',
            level: 4,
            postingCount: 2,
            frequency: 2 / 3,
          },
          {
            id: expect.any(String),
            name: 'Java',
            pattern: '\\bJava\\b',
            level: null,
            postingCount: 1,
            frequency: 1 / 3,
          },
          {
            id: expect.any(String),
            name: 'SQL',
            pattern: '\\bSQL\\b',
            level: null,
            postingCount: 1,
            frequency: 1 / 3,
          },
        ],
      });
    });

    it('has a null frequency without any posting text', async () => {
      await createSkill({ name: 'Java', pattern: '\\bJava\\b' });

      const response = await api().get('/skills/stats').set(auth()).expect(200);

      expect(response.body).toEqual({
        postingsAnalyzed: 0,
        skills: [
          {
            id: expect.any(String),
            name: 'Java',
            pattern: '\\bJava\\b',
            level: null,
            postingCount: 0,
            frequency: null,
          },
        ],
      });
    });
  });

  it('keeps each user’s skills and postings separate', async () => {
    const { id } = await createSkill({ name: 'Java', pattern: '\\bJava\\b' });
    await createApplication('Backend Java');
    const otherToken = await registerUser(app, 'john@example.com');

    expect((await api().get('/skills').set(auth(otherToken)).expect(200)).body).toEqual([]);
    await api().patch(`/skills/${id}`).set(auth(otherToken)).send({ level: 1 }).expect(404);
    await api().delete(`/skills/${id}`).set(auth(otherToken)).expect(404);
    await createSkill({ name: 'Java', pattern: '\\bJava\\b' }, otherToken);

    const stats = await api().get('/skills/stats').set(auth(otherToken)).expect(200);
    expect(stats.body.postingsAnalyzed).toBe(0);
  });

  it('requires a token', async () => {
    await api().get('/skills').expect(401);
    await api().get('/skills/stats').expect(401);
  });
});
