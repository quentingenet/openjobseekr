import type { INestApplication } from '@nestjs/common';
import { IMPORT_LIMITS } from '@openjobseekr/domain';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { applicationRow, spreadsheetFile } from '../src/spreadsheet/testing/spreadsheet-file.js';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { registerUser } from './helpers/auth.js';
import { createTestApp, resetDatabase } from './helpers/create-app.js';

describe('Import (e2e)', () => {
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

  const upload = (file: Buffer, fileName: string, bearer = token) =>
    api().post('/import').set(auth(bearer)).attach('file', file, fileName);

  async function seed(bearer = token) {
    await api()
      .post('/applications')
      .set(auth(bearer))
      .send({ sentAt: '2026-09-01', company: 'Old Corp', jobTitle: 'Dev' })
      .expect(201);
    await api()
      .post('/skills')
      .set(auth(bearer))
      .send({ name: 'TypeScript', pattern: '\\bTypeScript\\b', level: 3 })
      .expect(201);
  }

  const companies = async (bearer = token) => {
    const response = await api().get('/applications').set(auth(bearer)).expect(200);
    return (response.body as { items: { company: string }[] }).items.map((item) => item.company);
  };

  const skills = async (bearer = token) => {
    const response = await api().get('/skills').set(auth(bearer)).expect(200);
    return response.body as { name: string; pattern: string; level: number | null }[];
  };

  const file = spreadsheetFile({
    applications: [
      applicationRow({
        'DATE ENVOI CANDIDATURE': 46296,
        ENTREPRISE: 'Acme',
        'INTITULÉ OFFRE': 'Full-stack developer',
        STATUT: 'Envoyée',
        "TEXTE DE L'ANNONCE": 'TypeScript and Go',
      }),
      applicationRow({
        'DATE ENVOI CANDIDATURE': '02/10/2026',
        ENTREPRISE: 'Globex',
        'INTITULÉ OFFRE': 'Backend developer',
        CANAL: 'Apec',
        STATUT: 'Refus',
      }),
    ],
    skills: [
      ['typescript', 'TS'],
      ['Go', '\\bGo\\b', null, null, 1],
    ],
  });

  it('replaces the applications and adds the new skills', async () => {
    await seed();

    const response = await upload(file, 'suivi.xlsx').expect(200);

    expect(response.body).toEqual({
      deletedApplications: 1,
      importedApplications: 2,
      addedSkills: 1,
      ignoredSkills: [{ row: 4, name: 'typescript', keptName: 'TypeScript' }],
      keptFollowUpDates: 0,
    });
    expect(await companies()).toEqual(['Globex', 'Acme']);
    expect(await skills()).toEqual([
      { id: expect.any(String), name: 'Go', pattern: '\\bGo\\b', level: 1 },
      { id: expect.any(String), name: 'TypeScript', pattern: '\\bTypeScript\\b', level: 3 },
    ]);
    const list = await api().get('/applications').set(auth()).expect(200);
    expect(list.body.items[1]).toMatchObject({
      sentAt: '2026-10-01',
      status: 'SENT',
      followUpDate: '2026-10-08',
      channel: null,
    });
  });

  it('keeps a follow-up date changed by hand in the sheet', async () => {
    const withDates = spreadsheetFile({
      applications: [
        applicationRow({
          'DATE ENVOI CANDIDATURE': 46296,
          ENTREPRISE: 'Acme',
          'INTITULÉ OFFRE': 'Dev',
          'DATE DE RELANCE': '20/10/2026',
        }),
        applicationRow({
          'DATE ENVOI CANDIDATURE': 46296,
          ENTREPRISE: 'Globex',
          'INTITULÉ OFFRE': 'Dev',
          'DATE DE RELANCE': 46303,
        }),
      ],
    });

    await upload(withDates, 'suivi.xlsx').expect(200);

    const list = await api().get('/applications?order=asc').set(auth()).expect(200);
    expect(
      list.body.items.map(
        (item: { company: string; followUpDate: string; followUpOverride: string | null }) => [
          item.company,
          item.followUpDate,
          item.followUpOverride,
        ],
      ),
    ).toEqual(
      expect.arrayContaining([
        ['Acme', '2026-10-20', '2026-10-20'],
        ['Globex', '2026-10-08', null],
      ]),
    );
  });

  it('keeps a follow-up date picked in the app, and the follow-ups recorded, on a new import', async () => {
    await upload(file, 'suivi.xlsx').expect(200);
    const list = await api().get('/applications?status=SENT').set(auth()).expect(200);
    const acme = (list.body.items as { id: string; company: string }[]).find(
      (item) => item.company === 'Acme',
    );
    await api()
      .patch(`/applications/${acme?.id ?? ''}`)
      .set(auth())
      .send({ followUpOverride: '2026-10-22', followUpCount: 2 })
      .expect(200);

    const again = await upload(file, 'suivi.xlsx').expect(200);

    expect(again.body.keptFollowUpDates).toBe(1);
    const after = await api().get('/applications?status=SENT').set(auth()).expect(200);
    expect(after.body.items).toEqual([
      expect.objectContaining({
        company: 'Acme',
        followUpDate: '2026-10-22',
        followUpOverride: '2026-10-22',
        followUpCount: 2,
      }),
    ]);
  });

  it('imports an OpenDocument spreadsheet', async () => {
    const ods = spreadsheetFile(
      {
        applications: [
          applicationRow({
            'DATE ENVOI CANDIDATURE': 46296,
            ENTREPRISE: 'Acme',
            'INTITULÉ OFFRE': 'Dev',
          }),
        ],
      },
      'ods',
    );

    await upload(ods, 'suivi.ods').expect(200);

    expect(await companies()).toEqual(['Acme']);
  });

  it('never touches the data of another user', async () => {
    const otherToken = await registerUser(app, 'john@example.com');
    await seed(otherToken);

    await upload(file, 'suivi.xlsx').expect(200);

    expect(await companies(otherToken)).toEqual(['Old Corp']);
    expect((await skills(otherToken)).map((skill) => skill.name)).toEqual(['TypeScript']);
  });

  it('reports invalid cells as a problem and changes nothing', async () => {
    await seed();
    const invalid = spreadsheetFile({
      applications: [
        applicationRow({ ENTREPRISE: 'Acme', 'INTITULÉ OFFRE': 'Dev', STATUT: 'Pending' }),
      ],
    });

    const response = await upload(invalid, 'suivi.xlsx')
      .expect(422)
      .expect('Content-Type', /application\/problem\+json/);

    expect(response.body).toEqual({
      type: 'urn:openjobseekr:error:import-invalid-data',
      title: 'Spreadsheet has invalid cells',
      status: 422,
      instance: '/import',
      code: 'IMPORT_INVALID_DATA',
      errors: [
        { field: 'Candidatures!A2', constraints: ['isNotEmpty'] },
        { field: 'Candidatures!H2', constraints: ['isIn'] },
      ],
    });
    expect(await companies()).toEqual(['Old Corp']);
  });

  it('rejects a CSV file, even renamed', async () => {
    const csv = Buffer.from('DATE ENVOI CANDIDATURE,ENTREPRISE\n01/10/2026,Acme\n');

    const response = await upload(csv, 'suivi.xlsx').expect(415);

    expect(response.body.code).toBe('IMPORT_UNSUPPORTED_FILE');
  });

  it('requires a file', async () => {
    const response = await api().post('/import').set(auth()).expect(400);

    expect(response.body).toMatchObject({
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'file', constraints: ['isNotEmpty'] }],
    });
  });

  it('rejects a file above the size limit', async () => {
    const response = await upload(Buffer.alloc(IMPORT_LIMITS.maxFileBytes + 1), 'big.xlsx').expect(
      413,
    );

    expect(response.body.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('requires authentication', async () => {
    const response = await api().post('/import').attach('file', file, 'suivi.xlsx').expect(401);

    expect(response.body.code).toBe('UNAUTHORIZED');
  });
});
