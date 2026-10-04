import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppException } from '../common/app.exception.js';
import { Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { SkillsService } from './skills.service.js';

const ID = '6c3f4d2e-0000-4000-8000-000000000001';

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('Prisma error', { code, clientVersion: '7.10.0' });

function setup() {
  const prisma = {
    skill: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    application: { findMany: vi.fn() },
  };
  return { prisma, service: new SkillsService(prisma as unknown as PrismaService) };
}

describe('SkillsService', () => {
  let ctx: ReturnType<typeof setup>;

  beforeEach(() => {
    ctx = setup();
  });

  it('turns a duplicate name into SKILL_NAME_ALREADY_USED (409)', async () => {
    ctx.prisma.skill.create.mockRejectedValue(prismaError('P2002'));

    const error = await ctx.service
      .create('user-1', { name: 'Java', pattern: '\\bJava\\b' })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AppException);
    expect((error as AppException).getStatus()).toBe(409);
    expect((error as AppException).getResponse()).toEqual({
      code: 'SKILL_NAME_ALREADY_USED',
      message: 'A skill named "Java" already exists',
    });
  });

  it('turns a missing or foreign skill into SKILL_NOT_FOUND (404), scoped by user', async () => {
    ctx.prisma.skill.update.mockRejectedValue(prismaError('P2025'));
    ctx.prisma.skill.delete.mockRejectedValue(prismaError('P2025'));

    const update = await ctx.service.update('user-1', ID, { level: 2 }).catch((e: unknown) => e);
    const remove = await ctx.service.remove('user-1', ID).catch((e: unknown) => e);

    expect((update as AppException).getResponse()).toEqual({
      code: 'SKILL_NOT_FOUND',
      message: `Skill ${ID} not found`,
    });
    expect((remove as AppException).getStatus()).toBe(404);
    expect(ctx.prisma.skill.delete).toHaveBeenCalledWith({ where: { id: ID, userId: 'user-1' } });
  });

  it('rethrows other database errors unchanged', async () => {
    const failure = new Error('connection lost');
    ctx.prisma.skill.create.mockRejectedValue(failure);

    await expect(ctx.service.create('user-1', { name: 'Java', pattern: 'Java' })).rejects.toBe(
      failure,
    );
  });

  it('stores a missing level as null', async () => {
    ctx.prisma.skill.create.mockResolvedValue({
      id: ID,
      name: 'Java',
      pattern: 'Java',
      level: null,
    });

    await ctx.service.create('user-1', { name: 'Java', pattern: 'Java' });

    expect(ctx.prisma.skill.create).toHaveBeenCalledWith({
      data: { name: 'Java', pattern: 'Java', level: null, userId: 'user-1' },
      select: { id: true, name: true, pattern: true, level: true },
    });
  });

  it('computes stats from the user’s posting texts only', async () => {
    ctx.prisma.skill.findMany.mockResolvedValue([
      { id: ID, name: 'Java', pattern: '\\bJava\\b', level: null },
    ]);
    ctx.prisma.application.findMany.mockResolvedValue([
      { jobPostingText: 'Backend Java' },
      { jobPostingText: 'Frontend JavaScript' },
    ]);

    const stats = await ctx.service.stats('user-1');

    expect(stats).toEqual({
      postingsAnalyzed: 2,
      skills: [
        {
          id: ID,
          name: 'Java',
          pattern: '\\bJava\\b',
          level: null,
          postingCount: 1,
          frequency: 0.5,
        },
      ],
    });
    expect(ctx.prisma.application.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', jobPostingText: { not: null } },
      select: { jobPostingText: true },
    });
  });
});
