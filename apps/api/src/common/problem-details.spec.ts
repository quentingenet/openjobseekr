import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { Prisma } from '../generated/prisma/client.js';
import { AppException } from './app.exception.js';
import { ErrorCode } from './error-codes.js';
import { problemType, toProblemDetails } from './problem-details.js';

describe('problemType', () => {
  it('builds a URN from the error code', () => {
    expect(problemType(ErrorCode.APPLICATION_NOT_FOUND)).toBe(
      'urn:openjobseekr:error:application-not-found',
    );
  });
});

describe('toProblemDetails', () => {
  it('takes status and title from the catalog, with detail and instance', () => {
    const exception = new AppException(ErrorCode.UNAUTHORIZED, 'Missing bearer token');

    expect(toProblemDetails(exception, '/auth/me')).toEqual({
      type: 'urn:openjobseekr:error:unauthorized',
      title: 'Authentication required',
      status: 401,
      detail: 'Missing bearer token',
      instance: '/auth/me',
      code: 'UNAUTHORIZED',
    });
  });

  it('lists invalid fields in `errors` and omits an absent detail', () => {
    const exception = new AppException(ErrorCode.VALIDATION_FAILED, undefined, [
      { field: 'company', constraints: ['isNotEmpty'] },
    ]);

    expect(toProblemDetails(exception, '/applications')).toEqual({
      type: 'urn:openjobseekr:error:validation-failed',
      title: 'Validation failed',
      status: 400,
      instance: '/applications',
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'company', constraints: ['isNotEmpty'] }],
    });
  });

  it.each([
    [new NotFoundException('Cannot GET /nope'), 404, 'NOT_FOUND'],
    [new BadRequestException('Unexpected end of JSON input'), 400, 'BAD_REQUEST'],
    [new ForbiddenException('No'), 403, 'FORBIDDEN'],
    [new ConflictException('Taken'), 409, 'CONFLICT'],
    [new PayloadTooLargeException('Too big'), 413, 'PAYLOAD_TOO_LARGE'],
    [new ServiceUnavailableException('Down'), 503, 'SERVICE_UNAVAILABLE'],
    [new UnprocessableEntityException('Nope'), 422, 'BAD_REQUEST'],
    [new HttpException('Slow down', HttpStatus.TOO_MANY_REQUESTS), 429, 'TOO_MANY_REQUESTS'],
    [new HttpException('Bad gateway', HttpStatus.BAD_GATEWAY), 502, 'INTERNAL_ERROR'],
  ])('maps the framework exception %o to %i %s', (exception, status, code) => {
    const problem = toProblemDetails(exception, '/x');

    expect(problem.status).toBe(status);
    expect(problem.code).toBe(code);
    expect(problem.detail).toBe(exception.message);
  });

  it('maps the body-parser size error to PAYLOAD_TOO_LARGE', () => {
    const tooLarge = Object.assign(new Error('request entity too large'), {
      type: 'entity.too.large',
    });

    expect(toProblemDetails(tooLarge, '/applications')).toMatchObject({
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
    });
  });

  it('maps Prisma errors through the Prisma error mapping', () => {
    const notFound = new Prisma.PrismaClientKnownRequestError('No record', {
      code: 'P2025',
      clientVersion: '7.10.0',
      meta: { modelName: 'Skill' },
    });

    expect(toProblemDetails(notFound, '/skills/1')).toMatchObject({
      status: 404,
      code: 'SKILL_NOT_FOUND',
    });
  });

  it('hides the details of unexpected errors', () => {
    const problem = toProblemDetails(new Error('connection string: postgres://secret'), '/x');

    expect(problem).toEqual({
      type: 'urn:openjobseekr:error:internal-error',
      title: 'Internal server error',
      status: 500,
      instance: '/x',
      code: 'INTERNAL_ERROR',
    });
  });
});
