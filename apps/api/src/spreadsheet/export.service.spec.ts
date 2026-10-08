import { describe, expect, it, vi } from 'vitest';
import type { FollowUpContextProvider } from '../follow-up/follow-up-context.provider.js';
import type { Application } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { SkillsService } from '../skills/skills.service.js';
import { parseWorkbook } from './domain/parse-workbook.js';
import { ExportService } from './export.service.js';
import { readSpreadsheet } from './spreadsheet-reader.js';

const record: Application = {
  id: '6c3f4d2e-0000-4000-8000-000000000001',
  userId: 'user-1',
  sentAt: new Date('2026-10-01T00:00:00.000Z'),
  company: 'Acme',
  jobTitle: 'Developer',
  location: null,
  response: null,
  resources: null,
  channel: 'OTHER',
  channelDetail: 'Monster',
  status: 'SENT',
  contact: null,
  followUpOverride: new Date('2026-10-20T00:00:00.000Z'),
  workMode: null,
  remoteRhythm: null,
  salaryRange: null,
  cvVersion: null,
  stack: null,
  recruitmentProcess: null,
  notes: null,
  jobPostingText: 'React',
  createdAt: new Date('2026-10-01T09:00:00.000Z'),
  updatedAt: new Date('2026-10-01T09:00:00.000Z'),
};

function setup() {
  const prisma = { application: { findMany: vi.fn().mockResolvedValue([record]) } };
  const skills = {
    stats: vi.fn().mockResolvedValue({
      postingsAnalyzed: 1,
      skills: [
        { id: 's', name: 'React', pattern: 'React', level: 2, postingCount: 1, frequency: 1 },
      ],
    }),
  };
  const followUp = { context: () => ({ today: '2026-10-08', delayDays: 7 }) };
  const service = new ExportService(
    prisma as unknown as PrismaService,
    followUp as FollowUpContextProvider,
    skills as unknown as SkillsService,
  );
  return { prisma, skills, service };
}

describe('ExportService', () => {
  it('exports the user’s applications, oldest first, and skills, named after today', async () => {
    const { prisma, skills, service } = setup();

    const file = await service.exportSpreadsheet('user-1', 'ods');

    expect(prisma.application.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: [{ sentAt: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    expect(skills.stats).toHaveBeenCalledWith('user-1');
    expect(file.fileName).toBe('suivi_candidatures_2026-10-08.ods');
    expect(file.contentType).toBe('application/vnd.oasis.opendocument.spreadsheet');
    const workbook = readSpreadsheet(file.content, file.fileName);
    expect(workbook && parseWorkbook(workbook, { followUpDelayDays: 7 })).toMatchObject({
      ok: true,
      applications: [
        {
          sentAt: '2026-10-01',
          company: 'Acme',
          channel: 'OTHER',
          channelDetail: 'Monster',
          followUpOverride: '2026-10-20',
          jobPostingText: 'React',
        },
      ],
      skills: [{ name: 'React', pattern: 'React', level: 2 }],
    });
  });
});
