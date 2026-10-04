import type { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appError } from '../common/testing/app-error.js';
import { Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

const createdAt = new Date('2026-10-04T08:00:00.000Z');

function setup() {
  const prisma = {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  };
  const jwt = { signAsync: vi.fn().mockResolvedValue('signed-token') };
  const service = new AuthService(prisma as unknown as PrismaService, jwt as unknown as JwtService);
  return { prisma, jwt, service };
}

describe('AuthService', () => {
  let ctx: ReturnType<typeof setup>;

  beforeEach(() => {
    ctx = setup();
  });

  describe('register', () => {
    it('stores a bcrypt hash, never the plain password, and returns a token', async () => {
      ctx.prisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'jane@example.com',
        createdAt,
      });

      const result = await ctx.service.register({
        email: 'jane@example.com',
        password: 'correct horse',
      });

      const data = ctx.prisma.user.create.mock.calls[0]?.[0].data;
      expect(data.email).toBe('jane@example.com');
      expect(data.passwordHash).not.toBe('correct horse');
      expect(await bcrypt.compare('correct horse', data.passwordHash)).toBe(true);
      expect(ctx.jwt.signAsync).toHaveBeenCalledWith({ sub: 'user-1', email: 'jane@example.com' });
      expect(result).toEqual({
        accessToken: 'signed-token',
        user: { id: 'user-1', email: 'jane@example.com', createdAt: '2026-10-04T08:00:00.000Z' },
      });
    });

    it('lets a duplicate email through to the global error handling (EMAIL_ALREADY_USED)', async () => {
      const duplicate = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.0',
        meta: { modelName: 'User' },
      });
      ctx.prisma.user.create.mockRejectedValue(duplicate);

      await expect(
        ctx.service.register({ email: 'jane@example.com', password: 'correct horse' }),
      ).rejects.toBe(duplicate);
    });
  });

  describe('login', () => {
    it('returns a token and the public user fields when the password matches', async () => {
      const passwordHash = await bcrypt.hash('correct horse', 4);
      ctx.prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'jane@example.com',
        passwordHash,
        createdAt,
      });

      const result = await ctx.service.login({
        email: 'jane@example.com',
        password: 'correct horse',
      });

      expect(result).toEqual({
        accessToken: 'signed-token',
        user: { id: 'user-1', email: 'jane@example.com', createdAt: '2026-10-04T08:00:00.000Z' },
      });
      expect(JSON.stringify(result)).not.toContain(passwordHash);
    });

    it('throws INVALID_CREDENTIALS (401) on a wrong password', async () => {
      ctx.prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'jane@example.com',
        passwordHash: await bcrypt.hash('correct horse', 4),
        createdAt,
      });

      const error = await ctx.service
        .login({ email: 'jane@example.com', password: 'wrong password' })
        .catch((e: unknown) => e);

      expect(appError(error)).toMatchObject({ code: 'INVALID_CREDENTIALS', status: 401 });
    });

    it('throws the same INVALID_CREDENTIALS error for an unknown email', async () => {
      ctx.prisma.user.findUnique.mockResolvedValue(null);

      const error = await ctx.service
        .login({ email: 'nobody@example.com', password: 'whatever1' })
        .catch((e: unknown) => e);

      expect(appError(error)).toEqual({
        code: 'INVALID_CREDENTIALS',
        status: 401,
        detail: undefined,
        errors: undefined,
      });
      expect(ctx.jwt.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('returns the public fields of the user', async () => {
      ctx.prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'jane@example.com',
        createdAt,
      });

      expect(await ctx.service.getProfile('user-1')).toEqual({
        id: 'user-1',
        email: 'jane@example.com',
        createdAt: '2026-10-04T08:00:00.000Z',
      });
      expect(ctx.prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { id: true, email: true, createdAt: true },
      });
    });

    it('throws UNAUTHORIZED (401) when the user of a valid token no longer exists', async () => {
      ctx.prisma.user.findUnique.mockResolvedValue(null);

      const error = await ctx.service.getProfile('deleted-user').catch((e: unknown) => e);

      expect(appError(error)).toEqual({
        code: 'UNAUTHORIZED',
        status: 401,
        detail: 'User no longer exists',
        errors: undefined,
      });
    });
  });
});
