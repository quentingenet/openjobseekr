import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, resetDatabase } from './helpers/create-app.js';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  const credentials = { email: 'jane@example.com', password: 'correct horse battery' };

  it('registers, logs in and reads the profile with the token', async () => {
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: '  Jane@Example.com ', password: credentials.password })
      .expect(201);

    expect(register.body.user.email).toBe('jane@example.com');
    expect(typeof register.body.accessToken).toBe('string');
    expect(register.body.user).not.toHaveProperty('passwordHash');

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials)
      .expect(200);

    expect(Object.keys(login.body).sort()).toEqual(['accessToken', 'user']);
    expect(Object.keys(login.body.user).sort()).toEqual(['createdAt', 'email', 'id']);
    expect(login.body.user.id).toBe(register.body.user.id);

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);

    expect(me.body).toEqual({
      id: register.body.user.id,
      email: 'jane@example.com',
      createdAt: register.body.user.createdAt,
    });
  });

  it('stores a bcrypt hash, not the password', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(credentials).expect(201);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: credentials.email } });
    expect(user.passwordHash).not.toBe(credentials.password);
    expect(user.passwordHash.startsWith('$2b$12$')).toBe(true);
  });

  it('rejects a second account with the same email (409 EMAIL_ALREADY_USED)', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(credentials).expect(201);

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...credentials, email: 'JANE@example.com' })
      .expect(409);

    expect(response.body).toEqual({
      code: 'EMAIL_ALREADY_USED',
      message: 'An account already exists for this email',
    });
  });

  it('rejects a wrong password and an unknown email with the same error', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(credentials).expect(201);
    const expected = { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };

    const wrongPassword = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ ...credentials, password: 'not the password' })
      .expect(401);
    const unknownEmail = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ ...credentials, email: 'nobody@example.com' })
      .expect(401);

    expect(wrongPassword.body).toEqual(expected);
    expect(unknownEmail.body).toEqual(expected);
  });

  describe('protected route', () => {
    it('returns 401 UNAUTHORIZED without a token', async () => {
      const response = await request(app.getHttpServer()).get('/auth/me').expect(401);

      expect(response.body).toEqual({ code: 'UNAUTHORIZED', message: 'Missing bearer token' });
    });

    it('returns 401 UNAUTHORIZED for a signed token without a user id', async () => {
      const token = await app.get(JwtService).signAsync({ email: 'jane@example.com' });

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body).toEqual({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
    });

    it('returns 401 UNAUTHORIZED with an invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer not.a.jwt')
        .expect(401);

      expect(response.body).toEqual({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
    });
  });

  describe('validation error format', () => {
    it('returns 400 VALIDATION_FAILED with the failing fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'not-an-email', password: 'short' })
        .expect(400);

      expect(response.body).toEqual({
        code: 'VALIDATION_FAILED',
        message: 'Request validation failed',
        details: [
          { field: 'email', constraints: ['isEmail'] },
          { field: 'password', constraints: ['minLength'] },
        ],
      });
    });

    it('rejects a password longer than 72 bytes, even under 72 characters', async () => {
      // 37 characters, 74 bytes in UTF-8.
      const password = 'é'.repeat(37);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: credentials.email, password })
        .expect(400);

      expect(response.body).toEqual({
        code: 'VALIDATION_FAILED',
        message: 'Request validation failed',
        details: [{ field: 'password', constraints: ['isByteLength'] }],
      });
    });

    it('rejects unknown properties', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...credentials, role: 'admin' })
        .expect(400);

      expect(response.body).toEqual({
        code: 'VALIDATION_FAILED',
        message: 'Request validation failed',
        details: [{ field: 'role', constraints: ['whitelistValidation'] }],
      });
    });

    it('returns 400 BAD_REQUEST for a malformed JSON body', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": ')
        .expect(400);

      expect(response.body).toEqual({
        code: 'BAD_REQUEST',
        message: 'Unexpected end of JSON input',
      });
    });
  });

  it('returns 404 NOT_FOUND for an unknown route', async () => {
    const response = await request(app.getHttpServer()).get('/does-not-exist').expect(404);

    expect(response.body).toEqual({ code: 'NOT_FOUND', message: 'Cannot GET /does-not-exist' });
  });
});
