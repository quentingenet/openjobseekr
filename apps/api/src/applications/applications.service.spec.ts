import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appError } from '../common/testing/app-error.js';
import { type Application, Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ApplicationsService } from './applications.service.js';
import type { FollowUpContextProvider } from './follow-up-context.provider.js';

const ID = '6c3f4d2e-0000-4000-8000-000000000001';

const record: Application = {
  id: ID,
  userId: 'user-1',
  sentAt: new Date('2026-10-01T00:00:00.000Z'),
  company: 'Acme',
  jobTitle: 'Dev',
  location: null,
  response: null,
  resources: null,
  channel: null,
  channelDetail: null,
  status: 'SENT',
  contact: null,
  workMode: null,
  remoteRhythm: null,
  salaryRange: null,
  cvVersion: null,
  stack: null,
  recruitmentProcess: null,
  notes: null,
  jobPostingText: 'Text',
  createdAt: new Date('2026-10-01T09:00:00.000Z'),
  updatedAt: new Date('2026-10-01T09:00:00.000Z'),
};

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('Prisma error', { code, clientVersion: '7.10.0' });

function setup(delayDays = 7) {
  const prisma = {
    application: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
  };
  const followUp = { context: () => ({ today: '2026-10-09', delayDays }) };
  const service = new ApplicationsService(
    prisma as unknown as PrismaService,
    followUp as unknown as FollowUpContextProvider,
  );
  return { prisma, service };
}

describe('ApplicationsService', () => {
  let ctx: ReturnType<typeof setup>;

  beforeEach(() => {
    ctx = setup();
  });

  it('creates the application for the given user, with the date stored at UTC midnight', async () => {
    ctx.prisma.application.create.mockResolvedValue(record);

    await ctx.service.create('user-1', { sentAt: '2026-10-01', company: 'Acme', jobTitle: 'Dev' });

    expect(ctx.prisma.application.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        sentAt: new Date('2026-10-01T00:00:00.000Z'),
        company: 'Acme',
        jobTitle: 'Dev',
        channelDetail: null,
      },
    });
  });

  it('lets database errors through to the global error handling', async () => {
    const deletedUser = prismaError('P2003');
    ctx.prisma.application.create.mockRejectedValue(deletedUser);

    await expect(
      ctx.service.create('deleted-user', {
        sentAt: '2026-10-01',
        company: 'Acme',
        jobTitle: 'Dev',
      }),
    ).rejects.toBe(deletedUser);
  });

  it('uses the configured follow-up delay', async () => {
    ctx = setup(10);
    ctx.prisma.application.findFirst.mockResolvedValue(record);

    const detail = await ctx.service.findOne('user-1', ID);

    expect(detail.followUpDate).toBe('2026-10-11');
    expect(detail.followUpOverdue).toBe(false);
  });

  it('lists without the job posting text, scoped to the user, newest first', async () => {
    ctx.prisma.application.findMany.mockResolvedValue([]);
    ctx.prisma.application.count.mockResolvedValue(0);

    const result = await ctx.service.list('user-1', { limit: 20, offset: 40, order: 'desc' });

    expect(result).toEqual({ items: [], total: 0, limit: 20, offset: 40 });
    expect(ctx.prisma.application.findMany).toHaveBeenCalledWith({
      where: { AND: [{ userId: 'user-1' }] },
      omit: { jobPostingText: true },
      orderBy: [{ sentAt: 'desc' }, { createdAt: 'desc' }],
      skip: 40,
      take: 20,
    });
  });

  it('sorts oldest first when order is asc', async () => {
    ctx.prisma.application.findMany.mockResolvedValue([]);
    ctx.prisma.application.count.mockResolvedValue(0);

    await ctx.service.list('user-1', { limit: 20, offset: 0, order: 'asc' });

    expect(ctx.prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: [{ sentAt: 'asc' }, { createdAt: 'asc' }] }),
    );
  });

  it('looks up a single application by id and user', async () => {
    ctx.prisma.application.findFirst.mockResolvedValue(null);

    expect(appError(await ctx.service.findOne('user-1', ID).catch((e: unknown) => e))).toEqual({
      code: 'APPLICATION_NOT_FOUND',
      status: 404,
      detail: undefined,
      errors: undefined,
    });
    expect(ctx.prisma.application.findFirst).toHaveBeenCalledWith({
      where: { id: ID, userId: 'user-1' },
    });
  });

  it('updates and deletes only within the user scope; a miss surfaces as a Prisma error', async () => {
    const missing = prismaError('P2025');
    ctx.prisma.application.update.mockRejectedValue(missing);
    ctx.prisma.application.delete.mockRejectedValue(missing);

    await expect(ctx.service.update('user-1', ID, { notes: 'x' })).rejects.toBe(missing);
    await expect(ctx.service.remove('user-1', ID)).rejects.toBe(missing);
    expect(ctx.prisma.application.update).toHaveBeenCalledWith({
      where: { id: ID, userId: 'user-1' },
      data: { notes: 'x' },
    });
    expect(ctx.prisma.application.delete).toHaveBeenCalledWith({
      where: { id: ID, userId: 'user-1' },
    });
  });
});
