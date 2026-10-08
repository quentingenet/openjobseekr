import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorCode } from '../common/error-codes.js';
import type { FollowUpContextProvider } from '../follow-up/follow-up-context.provider.js';
import { appError } from '../common/testing/app-error.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ImportService } from './import.service.js';
import { applicationRow, spreadsheetFile } from './testing/spreadsheet-file.js';

function setup() {
  const tx = {
    application: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 5 }),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    skill: {
      findMany: vi.fn().mockResolvedValue([{ name: 'TypeScript' }]),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const prisma = {
    $transaction: vi.fn((run: (client: typeof tx) => Promise<unknown>) => run(tx)),
  };
  return {
    tx,
    prisma,
    service: new ImportService(
      prisma as unknown as PrismaService,
      {
        delayDays: 7,
      } as FollowUpContextProvider,
    ),
  };
}

const validFile = () => ({
  originalname: 'suivi.xlsx',
  buffer: spreadsheetFile({
    applications: [
      applicationRow({
        'DATE ENVOI CANDIDATURE': 46296,
        ENTREPRISE: 'Acme',
        'INTITULÉ OFFRE': 'Developer',
        CANAL: 'Autre',
        STATUT: 'Refus',
        'DATE DE RELANCE': '20/10/2026',
      }),
    ],
    skills: [
      ['TYPESCRIPT', '\\bTS\\b'],
      ['Go', '\\bGo(lang)?\\b', null, null, 2],
    ],
  }),
});

describe('ImportService', () => {
  let ctx: ReturnType<typeof setup>;

  beforeEach(() => {
    ctx = setup();
  });

  it('replaces the applications and adds the new skills of the user only', async () => {
    const result = await ctx.service.importSpreadsheet('user-1', validFile());

    expect(ctx.tx.skill.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: { name: true },
    });
    expect(ctx.tx.application.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(ctx.tx.application.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          userId: 'user-1',
          sentAt: new Date('2026-10-01T00:00:00.000Z'),
          company: 'Acme',
          jobTitle: 'Developer',
          channel: 'OTHER',
          status: 'REJECTED',
          followUpOverride: new Date('2026-10-20T00:00:00.000Z'),
          location: null,
        }),
      ],
    });
    expect(ctx.tx.skill.createMany).toHaveBeenCalledWith({
      data: [{ name: 'Go', pattern: '\\bGo(lang)?\\b', level: 2, userId: 'user-1' }],
    });
    expect(result).toEqual({
      deletedApplications: 5,
      importedApplications: 1,
      addedSkills: 1,
      ignoredSkills: [{ row: 4, name: 'TYPESCRIPT', keptName: 'TypeScript' }],
      keptFollowUpDates: 0,
    });
  });

  it('keeps the follow-up dates picked in the app for the applications found again', async () => {
    ctx.tx.application.findMany.mockResolvedValue([
      {
        sentAt: new Date('2026-10-01T00:00:00.000Z'),
        company: 'Acme',
        jobTitle: 'Developer',
        followUpOverride: new Date('2026-10-22T00:00:00.000Z'),
      },
    ]);
    const buffer = spreadsheetFile({
      applications: [
        applicationRow({
          'DATE ENVOI CANDIDATURE': 46296,
          ENTREPRISE: 'Acme',
          'INTITULÉ OFFRE': 'Developer',
          'DATE DE RELANCE': 46303,
        }),
      ],
    });

    const result = await ctx.service.importSpreadsheet('user-1', {
      originalname: 'suivi.xlsx',
      buffer,
    });

    expect(ctx.tx.application.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: { sentAt: true, company: true, jobTitle: true, followUpOverride: true },
    });
    expect(ctx.tx.application.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ followUpOverride: new Date('2026-10-22T00:00:00.000Z') })],
    });
    expect(result.keptFollowUpDates).toBe(1);
  });

  it('requires a file', async () => {
    const error = await ctx.service.importSpreadsheet('user-1', undefined).catch(appError);

    expect(error).toMatchObject({
      code: ErrorCode.VALIDATION_FAILED,
      status: 400,
      errors: [{ field: 'file', constraints: ['isNotEmpty'] }],
    });
    expect(ctx.prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a file that is not an .xlsx or .ods spreadsheet', async () => {
    const error = await ctx.service
      .importSpreadsheet('user-1', { originalname: 'suivi.csv', buffer: Buffer.from('a,b\n') })
      .catch(appError);

    expect(error).toMatchObject({ code: ErrorCode.IMPORT_UNSUPPORTED_FILE, status: 415 });
    expect(ctx.prisma.$transaction).not.toHaveBeenCalled();
  });

  it('changes nothing when a cell is invalid', async () => {
    const buffer = spreadsheetFile({
      applications: [applicationRow({ ENTREPRISE: 'Acme', 'INTITULÉ OFFRE': 'Dev' })],
    });

    const error = await ctx.service
      .importSpreadsheet('user-1', { originalname: 'suivi.xlsx', buffer })
      .catch(appError);

    expect(error).toMatchObject({
      code: ErrorCode.IMPORT_INVALID_DATA,
      status: 422,
      errors: [{ field: 'Candidatures!A2', constraints: ['isNotEmpty'] }],
    });
    expect(ctx.prisma.$transaction).not.toHaveBeenCalled();
  });
});
