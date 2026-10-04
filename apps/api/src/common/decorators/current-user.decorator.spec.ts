import type { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants.js';
import { describe, expect, it } from 'vitest';
import { type AuthenticatedUser, CurrentUser } from './current-user.decorator.js';

type ParamFactory = (data: unknown, context: ExecutionContext) => AuthenticatedUser;

/** Extracts the factory NestJS stores for a custom parameter decorator. */
function getFactory(): ParamFactory {
  class TestController {
    handler(@CurrentUser() _user: AuthenticatedUser): void {}
  }
  const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'handler') as Record<
    string,
    { factory: ParamFactory }
  >;
  const [entry] = Object.values(metadata);
  if (!entry) throw new Error('CurrentUser metadata not found');
  return entry.factory;
}

function contextWithUser(user: AuthenticatedUser | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('CurrentUser', () => {
  it('returns the user set on the request by the guard', () => {
    const user = { id: 'user-1', email: 'jane@example.com' };

    expect(getFactory()(undefined, contextWithUser(user))).toEqual(user);
  });

  it('fails loudly when used on a public route', () => {
    expect(() => getFactory()(undefined, contextWithUser(undefined))).toThrow(
      'No authenticated user on the request (@Public() route or missing guard)',
    );
  });
});
