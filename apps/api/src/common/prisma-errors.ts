import { AppException } from './app.exception.js';
import { ErrorCode } from './error-codes.js';
import { Prisma } from '../generated/prisma/client.js';

/** Prisma error codes the API translates. */
const PrismaErrorCode = {
  UNIQUE_VIOLATION: 'P2002',
  FOREIGN_KEY_VIOLATION: 'P2003',
  RECORD_NOT_FOUND: 'P2025',
} as const;

// Every update/delete is scoped by user, so "not found" also covers another user's record.
const notFoundByModel: Partial<Record<string, ErrorCode>> = {
  Application: ErrorCode.APPLICATION_NOT_FOUND,
  Skill: ErrorCode.SKILL_NOT_FOUND,
};

const duplicateByModel: Partial<Record<string, ErrorCode>> = {
  User: ErrorCode.EMAIL_ALREADY_USED,
  Skill: ErrorCode.SKILL_NAME_ALREADY_USED,
};

/** The API error for a Prisma error, or undefined when it is not one Prisma reports. */
export function appExceptionFromPrismaError(error: unknown): AppException | undefined {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return undefined;
  const model = (error.meta as { modelName?: string } | undefined)?.modelName ?? '';
  switch (error.code) {
    case PrismaErrorCode.RECORD_NOT_FOUND:
      return new AppException(notFoundByModel[model] ?? ErrorCode.NOT_FOUND);
    case PrismaErrorCode.UNIQUE_VIOLATION:
      return new AppException(duplicateByModel[model] ?? ErrorCode.CONFLICT);
    case PrismaErrorCode.FOREIGN_KEY_VIOLATION:
      // The only foreign keys point to the user: a still-valid token for a deleted account.
      return new AppException(ErrorCode.UNAUTHORIZED, 'User no longer exists');
    default:
      return undefined;
  }
}
