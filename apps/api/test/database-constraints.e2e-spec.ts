import type { INestApplication } from '@nestjs/common';
import {
  CREDENTIAL_LIMITS,
  FOLLOW_UP_COUNT,
  SKILL_LEVEL,
  SKILL_LIMITS,
  TEXT_LIMITS,
} from '@openjobseekr/domain';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, resetDatabase } from './helpers/create-app.js';

// Writes straight through Prisma, bypassing the API validation, to check that the database
// protects itself (e.g. against a script or a future import that forgets to validate).
const limits = TEXT_LIMITS;

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

  it('rejects an email longer than the shared limit', async () => {
    const domain = '@x.io';
    const local = 'a'.repeat(CREDENTIAL_LIMITS.emailMaxLength - domain.length + 1);
    await expect(
      prisma.user.create({ data: { email: `${local}${domain}`, passwordHash: 'not-used' } }),
    ).rejects.toThrow('User_email_length');
  });

  // Reads the constraints the database really has (a migration could drop or change one),
  // and compares them with the shared limits.
  it('has exactly the CHECK constraints of the shared limits', async () => {
    const rows = await prisma.$queryRaw<{ name: string; definition: string }[]>`
      SELECT conname AS name, pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE contype = 'c' AND connamespace = 'public'::regnamespace`;
    // PostgreSQL rewrites `BETWEEN a AND b` as `>= a AND <= b`.
    const bounds = Object.fromEntries(
      rows.map(({ name, definition }) => [
        name,
        {
          min: Number(/>= (\d+)/.exec(definition)?.[1] ?? 0),
          max: Number(/<= (\d+)/.exec(definition)?.[1]),
        },
      ]),
    );
    const text = (max: number, min = 0) => ({ min, max });

    expect(bounds).toEqual({
      ...Object.fromEntries(
        Object.entries(TEXT_LIMITS).map(([field, max]) => [
          `Application_${field}_length`,
          text(max, field === 'company' || field === 'jobTitle' ? 1 : 0),
        ]),
      ),
      Application_followUpCount_range: text(FOLLOW_UP_COUNT.max, FOLLOW_UP_COUNT.min),
      Skill_name_length: text(SKILL_LIMITS.name, 1),
      Skill_pattern_length: text(SKILL_LIMITS.pattern, 1),
      Skill_level_range: text(SKILL_LEVEL.max, SKILL_LEVEL.min),
      User_email_length: text(CREDENTIAL_LIMITS.emailMaxLength, 3),
    });
  });
});
