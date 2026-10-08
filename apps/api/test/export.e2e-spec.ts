import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { readSpreadsheet } from '../src/spreadsheet/spreadsheet-reader.js';
import { registerUser } from './helpers/auth.js';
import { createTestApp, resetDatabase } from './helpers/create-app.js';

const TODAY = '2026-10-09';

/** Supertest buffers a binary body only with an explicit parser. */
function binary(response: request.Response, done: (error: Error | null, body: Buffer) => void) {
  const chunks: Buffer[] = [];
  response.on('data', (chunk: Buffer) => chunks.push(chunk));
  response.on('end', () => done(null, Buffer.concat(chunks)));
}

describe('Export (e2e)', () => {
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
  const auth = (bearer = token) => ({ Authorization: `Bearer ${bearer}` });

  async function seed(bearer = token) {
    await api()
      .post('/applications')
      .set(auth(bearer))
      .send({
        sentAt: '2026-10-01',
        company: 'Acme',
        jobTitle: 'Developer',
        channel: 'OTHER',
        channelDetail: 'Monster',
        followUpOverride: '2026-10-20',
        jobPostingText: 'We use TypeScript',
      })
      .expect(201);
    await api()
      .post('/applications')
      .set(auth(bearer))
      .send({ sentAt: '2026-09-20', company: 'Globex', jobTitle: 'DevOps', status: 'REJECTED' })
      .expect(201);
    await api()
      .post('/skills')
      .set(auth(bearer))
      .send({ name: 'TypeScript', pattern: '\\bTypeScript\\b', level: 3 })
      .expect(201);
  }

  const download = (format: string, bearer = token) =>
    api().get(`/export?format=${format}`).set(auth(bearer)).buffer(true).parse(binary);

  const applications = async () => {
    const response = await api().get('/applications?order=asc').set(auth()).expect(200);
    return (response.body as { items: Record<string, unknown>[] }).items.map(
      ({ id: _id, createdAt: _created, updatedAt: _updated, ...rest }) => rest,
    );
  };

  it.each([
    ['xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ['ods', 'application/vnd.oasis.opendocument.spreadsheet'],
  ])('downloads an .%s file named after today', async (format, contentType) => {
    await seed();

    const response = await download(format).expect(200);

    expect(response.headers['content-type']).toBe(contentType);
    expect(response.headers['content-disposition']).toBe(
      `attachment; filename="suivi_candidatures_${TODAY}.${format}"`,
    );
    const workbook = readSpreadsheet(response.body as Buffer, `export.${format}`);
    expect(workbook?.sheets.map((sheet) => sheet.name)).toEqual([
      'Candidatures',
      'Compétences',
      'Listes',
    ]);
    // Oldest first, like the sheet.
    expect(workbook?.sheets[0]?.rows.slice(1).map((row) => row[1])).toEqual(['Globex', 'Acme']);
  });

  it('gives back the same applications and skills when imported again', async () => {
    await seed();
    const before = await applications();
    const file = (await download('xlsx').expect(200)).body as Buffer;

    await api().post('/import').set(auth()).attach('file', file, 'export.xlsx').expect(200);

    expect(await applications()).toEqual(before);
    const skills = await api().get('/skills').set(auth()).expect(200);
    expect(skills.body).toEqual([
      { id: expect.any(String), name: 'TypeScript', pattern: '\\bTypeScript\\b', level: 3 },
    ]);
  });

  it('only exports the user’s own data', async () => {
    const otherToken = await registerUser(app, 'john@example.com');
    await seed(otherToken);

    const response = await download('xlsx').expect(200);

    const workbook = readSpreadsheet(response.body as Buffer, 'export.xlsx');
    expect(workbook?.sheets[0]?.rows).toHaveLength(1);
    expect(workbook?.sheets[1]?.rows.slice(3)).toEqual([]);
  });

  it('rejects an unknown format', async () => {
    const response = await api().get('/export?format=csv').set(auth()).expect(400);

    expect(response.body).toMatchObject({
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'format', constraints: ['isIn'] }],
    });
  });

  it('requires authentication', async () => {
    const response = await api().get('/export?format=xlsx').expect(401);

    expect(response.body.code).toBe('UNAUTHORIZED');
  });
});
