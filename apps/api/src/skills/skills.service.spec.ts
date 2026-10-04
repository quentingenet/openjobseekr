import { beforeEach, describe, expect, it, vi } from 'vitest';
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
