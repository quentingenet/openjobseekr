import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AppException } from './app.exception.js';
import { ErrorCode } from './error-codes.js';
import { toErrorResponse } from './http-exception.filter.js';

describe('toErrorResponse', () => {
  it('keeps the code, message and details of an AppException', () => {
    const exception = new AppException(
      ErrorCode.APPLICATION_NOT_FOUND,
      'Application not found',
      HttpStatus.NOT_FOUND,
      { id: 'abc' },
    );

    expect(toErrorResponse(exception)).toEqual({
      status: 404,
      body: {
        code: 'APPLICATION_NOT_FOUND',
        message: 'Application not found',
        details: { id: 'abc' },
      },
    });
  });

  it('omits details when an AppException has none', () => {
    const exception = new AppException(
      ErrorCode.UNAUTHORIZED,
      'Missing token',
      HttpStatus.UNAUTHORIZED,
    );

    expect(toErrorResponse(exception)).toEqual({
      status: 401,
      body: { code: 'UNAUTHORIZED', message: 'Missing token' },
    });
  });

  it('maps a framework 404 (unknown route) to NOT_FOUND', () => {
    expect(toErrorResponse(new NotFoundException('Cannot GET /nope'))).toEqual({
      status: 404,
      body: { code: 'NOT_FOUND', message: 'Cannot GET /nope' },
    });
  });

  it('maps framework 403 and 409 to FORBIDDEN and CONFLICT', () => {
    expect(toErrorResponse(new ForbiddenException('No'))).toEqual({
      status: 403,
      body: { code: 'FORBIDDEN', message: 'No' },
    });
    expect(toErrorResponse(new ConflictException('Taken'))).toEqual({
      status: 409,
      body: { code: 'CONFLICT', message: 'Taken' },
    });
  });

  it('maps a 413 to PAYLOAD_TOO_LARGE', () => {
    expect(toErrorResponse(new PayloadTooLargeException('Too big'))).toEqual({
      status: 413,
      body: { code: 'PAYLOAD_TOO_LARGE', message: 'Too big' },
    });
  });

  it('maps the body-parser size error (not an HttpException) to PAYLOAD_TOO_LARGE', () => {
    const tooLarge = Object.assign(new Error('request entity too large'), {
      type: 'entity.too.large',
      status: 413,
    });

    expect(toErrorResponse(tooLarge)).toEqual({
      status: 413,
      body: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' },
    });
  });

  it('maps an unlisted 4xx status to BAD_REQUEST and keeps the status', () => {
    expect(toErrorResponse(new UnprocessableEntityException('Nope'))).toEqual({
      status: 422,
      body: { code: 'BAD_REQUEST', message: 'Nope' },
    });
  });

  it('maps a 503 to SERVICE_UNAVAILABLE', () => {
    expect(toErrorResponse(new ServiceUnavailableException('Down')).body.code).toBe(
      'SERVICE_UNAVAILABLE',
    );
  });

  it('maps a malformed JSON body (wrapped by NestJS) to BAD_REQUEST', () => {
    expect(toErrorResponse(new BadRequestException('Unexpected end of JSON input'))).toEqual({
      status: 400,
      body: { code: 'BAD_REQUEST', message: 'Unexpected end of JSON input' },
    });
  });

  it('hides the details of unexpected errors', () => {
    expect(toErrorResponse(new Error('connection string leaked: postgres://secret'))).toEqual({
      status: 500,
      body: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  });
});
