import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AppException } from '../common/app.exception.js';
import type { AuthenticatedRequest } from '../common/decorators/current-user.decorator.js';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator.js';
import { ErrorCode } from '../common/error-codes.js';
import type { JwtPayload } from './auth.service.js';

/** Registered globally: every route requires a bearer token unless marked `@Public()`. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      throw unauthorized('Missing bearer token');
    }
    try {
      const payload = await this.jwt.verifyAsync<Partial<JwtPayload>>(token);
      if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
        throw new Error('Unexpected token payload');
      }
      request.user = { id: payload.sub, email: payload.email };
      return true;
    } catch {
      throw unauthorized('Invalid or expired token');
    }
  }
}

function extractBearerToken(header: string | undefined): string | undefined {
  const [scheme, token] = header?.split(' ') ?? [];
  return scheme === 'Bearer' && token ? token : undefined;
}

function unauthorized(message: string): AppException {
  return new AppException(ErrorCode.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED);
}
