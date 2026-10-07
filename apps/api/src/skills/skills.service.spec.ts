import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorCode } from '../common/error-codes.js';
import { appError } from '../common/testing/app-error.js';
import { Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { SkillsService } from './skills.service.js';

const ID = '6c3f4d2e-0000-4000-8000-000000000001';

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('Prisma error', { code, clientVersion: '7.10.0' });

function setup() {
  const prisma = {
    skill: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    application: { findMany: vi.fn() },
  };
  return { prisma, service: new SkillsService(prisma as unknown as PrismaService) };
}

describe('SkillsService', () => {
  let ctx: ReturnType<typeof setup>;

  beforeEach(() => {
    ctx = setup();
  });

  it('lets database errors through to the global error handling', async () => {
    const duplicate = prismaError('P2002');
    const missing = prismaError('P2025');
    ctx.prisma.skill.create.mockRejectedValue(duplicate);
    ctx.prisma.skill.update.mockRejectedValue(missing);
    ctx.prisma.skill.delete.mockRejectedValue(missing);

    await expect(ctx.service.create('user-1', { name: 'Java', pattern: 'Java' })).rejects.toBe(
      duplicate,
    );
    await expect(ctx.service.update('user-1', ID, { level: 2 })).rejects.toBe(missing);
    await expect(ctx.service.remove('user-1', ID)).rejects.toBe(missing);
  });

  it('updates and deletes only within the user scope', async () => {
    ctx.prisma.skill.update.mockResolvedValue({ id: ID, name: 'Java', pattern: 'Java', level: 2 });
    ctx.prisma.skill.delete.mockResolvedValue({});

    await ctx.service.update('user-1', ID, { level: 2 });
    await ctx.service.remove('user-1', ID);

    expect(ctx.prisma.skill.update).toHaveBeenCalledWith({
      where: { id: ID, userId: 'user-1' },
      data: { level: 2 },
      select: { id: true, name: true, pattern: true, level: true },
    });
    expect(ctx.prisma.skill.delete).toHaveBeenCalledWith({ where: { id: ID, userId: 'user-1' } });
  });

  it('rejects a name the user already has, ignoring case and a ".js" suffix', async () => {
    ctx.prisma.skill.findMany.mockResolvedValue([{ name: 'TypeScript' }, { name: 'React' }]);

    for (const name of ['typescript', 'REACT', 'React.JS']) {
      const error = await ctx.service.create('user-1', { name, pattern: name }).catch(appError);
      expect(error).toMatchObject({ code: ErrorCode.SKILL_NAME_ALREADY_USED, status: 409 });
    }
    expect(ctx.prisma.skill.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: { name: true },
    });
    expect(ctx.prisma.skill.create).not.toHaveBeenCalled();
  });

  it('renames a skill unless another skill has the name', async () => {
    ctx.prisma.skill.findMany.mockResolvedValue([{ name: 'Java' }]);
    ctx.prisma.skill.update.mockResolvedValue({ id: ID, name: 'TS', pattern: 'TS', level: null });

    const error = await ctx.service.update('user-1', ID, { name: 'JAVA' }).catch(appError);
    await ctx.service.update('user-1', ID, { name: 'TypeScript' });

    expect(error).toMatchObject({ code: ErrorCode.SKILL_NAME_ALREADY_USED });
    expect(ctx.prisma.skill.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', id: { not: ID } },
      select: { name: true },
    });
    expect(ctx.prisma.skill.update).toHaveBeenCalledTimes(1);
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
