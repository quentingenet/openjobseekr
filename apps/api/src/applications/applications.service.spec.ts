import type { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppException } from '../common/app.exception.js';
import type { Clock } from '../common/clock.js';
import type { Env } from '../config/env.schema.js';
import { type Application, Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ApplicationsService } from './applications.service.js';

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

const recordNotFound = () =>
  new Prisma.PrismaClientKnownRequestError('No record found', {
    code: 'P2025',
    clientVersion: '7.10.0',
  });

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
  const clock = { today: () => '2026-10-09' };
  const config = { get: vi.fn(() => delayDays) };
  const service = new ApplicationsService(
    prisma as unknown as PrismaService,
    clock as Clock,
    config as unknown as ConfigService<Env, true>,
  );
  return { prisma, service };
}

async function expectNotFound(promise: Promise<unknown>): Promise<void> {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(AppException);
  expect((error as AppException).getStatus()).toBe(404);
  expect((error as AppException).getResponse()).toEqual({
    code: 'APPLICATION_NOT_FOUND',
    message: `Application ${ID} not found`,
  });
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

  it('throws UNAUTHORIZED when the user of the token no longer exists', async () => {
    ctx.prisma.application.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Foreign key constraint violated', {
        code: 'P2003',
        clientVersion: '7.10.0',
      }),
    );

    const error = await ctx.service
      .create('deleted-user', { sentAt: '2026-10-01', company: 'Acme', jobTitle: 'Dev' })
      .catch((e: unknown) => e);

    expect((error as AppException).getStatus()).toBe(401);
    expect((error as AppException).getResponse()).toEqual({
      code: 'UNAUTHORIZED',
      message: 'User no longer exists',
    });
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

    await expectNotFound(ctx.service.findOne('user-1', ID));
    expect(ctx.prisma.application.findFirst).toHaveBeenCalledWith({
      where: { id: ID, userId: 'user-1' },
    });
  });

  it('turns a missing record into APPLICATION_NOT_FOUND on update and delete', async () => {
    ctx.prisma.application.update.mockRejectedValue(recordNotFound());
    ctx.prisma.application.delete.mockRejectedValue(recordNotFound());

    await expectNotFound(ctx.service.update('user-1', ID, { notes: 'x' }));
    await expectNotFound(ctx.service.remove('user-1', ID));
    expect(ctx.prisma.application.update).toHaveBeenCalledWith({
      where: { id: ID, userId: 'user-1' },
      data: { notes: 'x' },
    });
    expect(ctx.prisma.application.delete).toHaveBeenCalledWith({
      where: { id: ID, userId: 'user-1' },
    });
  });

  it('rethrows other database errors unchanged', async () => {
    const failure = new Error('connection lost');
    ctx.prisma.application.delete.mockRejectedValue(failure);

    await expect(ctx.service.remove('user-1', ID)).rejects.toBe(failure);
  });
});
