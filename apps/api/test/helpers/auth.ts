import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

/** Registers a user and returns its bearer token. */
export async function registerUser(app: INestApplication, email: string): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password: 'correct horse battery' })
    .expect(201);
  return response.body.accessToken as string;
}
