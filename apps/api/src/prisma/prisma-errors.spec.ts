import { describe, expect, it } from 'vitest';
import { Prisma } from '../generated/prisma/client.js';
import { appExceptionFromPrismaError } from './prisma-errors.js';

describe('appExceptionFromPrismaError', () => {
  const error = (code: string, modelName?: string) =>
    new Prisma.PrismaClientKnownRequestError('Prisma error', {
      code,
      clientVersion: '7.10.0',
      meta: modelName ? { modelName } : undefined,
    });

  it.each([
    ['P2025', 'Application', 'APPLICATION_NOT_FOUND'],
    ['P2025', 'Skill', 'SKILL_NOT_FOUND'],
    ['P2025', 'Other', 'NOT_FOUND'],
    ['P2002', 'User', 'EMAIL_ALREADY_USED'],
    ['P2002', 'Skill', 'SKILL_NAME_ALREADY_USED'],
    ['P2002', undefined, 'CONFLICT'],
    ['P2003', 'Application', 'UNAUTHORIZED'],
  ])('maps %s on %s to %s', (code, model, expected) => {
    expect(appExceptionFromPrismaError(error(code, model))?.code).toBe(expected);
  });

  it('explains a foreign key violation as a deleted account', () => {
    expect(appExceptionFromPrismaError(error('P2003', 'Application'))?.detail).toBe(
      'User no longer exists',
    );
  });

  it('leaves other errors to the caller', () => {
    expect(appExceptionFromPrismaError(error('P2000', 'User'))).toBeUndefined();
    expect(appExceptionFromPrismaError(new Error('boom'))).toBeUndefined();
  });
});
