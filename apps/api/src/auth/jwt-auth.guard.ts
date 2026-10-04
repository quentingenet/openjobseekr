import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppException } from '../common/app.exception.js';
import type { AuthenticatedRequest } from '../common/decorators/current-user.decorator.js';
import { ErrorCode } from '../common/error-codes.js';
import type { JwtPayload } from './auth.service.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
