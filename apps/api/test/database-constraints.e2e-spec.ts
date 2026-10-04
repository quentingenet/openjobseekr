import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TEXT_LIMITS } from '../src/applications/dto/application-input.dto.js';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, resetDatabase } from './helpers/create-app.js';

// Writes straight through Prisma, bypassing the API validation, to check that the database
// protects itself (e.g. against a script or a future import that forgets to validate).
const limits = {
  company: TEXT_LIMITS.short,
  jobTitle: TEXT_LIMITS.short,
  location: TEXT_LIMITS.short,
  response: TEXT_LIMITS.medium,
  resources: TEXT_LIMITS.medium,
  contact: TEXT_LIMITS.short,
  remoteRhythm: TEXT_LIMITS.short,
  salaryRange: TEXT_LIMITS.short,
  cvVersion: TEXT_LIMITS.short,
  stack: TEXT_LIMITS.medium,
  recruitmentProcess: TEXT_LIMITS.long,
  notes: TEXT_LIMITS.long,
  jobPostingText: TEXT_LIMITS.jobPostingText,
} as const;

describe('Database constraints (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    ({ id: userId } = await prisma.user.create({
      data: { email: 'jane@example.com', passwordHash: 'not-used' },
    }));
  });

  afterAll(async () => {
    await app.close();
  });

  const base = () => ({ userId, sentAt: new Date('2026-10-01'), company: 'Acme', jobTitle: 'Dev' });

  it.each(Object.entries(limits))('accepts %s at its limit (%i)', async (field, max) => {
    await expect(
      prisma.application.create({ data: { ...base(), [field]: 'é'.repeat(max) } }),
    ).resolves.toBeDefined();
  });

  it.each(Object.entries(limits))('rejects %s above its limit (%i)', async (field, max) => {
    await expect(
      prisma.application.create({ data: { ...base(), [field]: 'é'.repeat(max + 1) } }),
    ).rejects.toThrow(`Application_${field}_length`);
  });

  it('rejects an empty company or job title', async () => {
    await expect(prisma.application.create({ data: { ...base(), company: '' } })).rejects.toThrow(
      'Application_company_length',
    );
    await expect(prisma.application.create({ data: { ...base(), jobTitle: '' } })).rejects.toThrow(
      'Application_jobTitle_length',
    );
  });

  it('rejects an email longer than 254 characters', async () => {
    await expect(
      prisma.user.create({
        data: { email: `${'a'.repeat(250)}@x.io`, passwordHash: 'not-used' },
      }),
    ).rejects.toThrow('User_email_length');
  });
});
