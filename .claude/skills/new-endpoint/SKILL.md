---
name: new-endpoint
description: Checklist to add or change an API endpoint in apps/api (DTO, service, controller, error codes, Swagger, tests). Use when adding a route to the NestJS API.
argument-hint: '[METHOD /path]'
---

# Add an API endpoint: $ARGUMENTS

Follow these steps in order. Read `.claude/rules/backend-nestjs.md` and
`.claude/rules/api-conventions.md` first.

1. **Plan**: state the method, path, request DTO, response shape, error codes and which user
   data it touches. Ask the user if something is unclear.
2. **Tests first** for any business logic (pure functions in `<feature>/domain/`, or in
   `packages/domain` when the web app needs it too): write them, run them, see them fail.
3. **DTO** in `<feature>/dto/`: `class-validator` decorators on every field, `@ApiProperty`
   for Swagger, dates as `YYYY-MM-DD` strings, enums as English codes, text limits from
   `TEXT_LIMITS`/`SKILL_LIMITS` (`@openjobseekr/domain`).
4. **Error codes**: add any new code to `ErrorCode` and `ERROR_CATALOG` in
   `common/error-codes.ts`, and the matching `errors.<CODE>` key in every web locale file.
5. **Service**: Prisma access scoped by `userId`, throws `AppException` with stable codes, no
   try/catch for Prisma errors (translated globally), no HTTP concerns.
6. **Controller**: route, guard (`JwtAuthGuard` unless public), current-user decorator, DTO
   validation, calls the service only. Swagger decorators: `@ApiTags`, `@ApiBearerAuth`,
   `@ApiOperation`, `@ApiOkResponse`/`@ApiCreatedResponse` and the error responses.
7. **Tests**: service unit tests (`*.spec.ts`) and an e2e test (`apps/api/test/*.e2e-spec.ts`)
   covering success, validation error format, 401 without a token, 404 and ownership
   isolation between two users.
8. **Web types**: run `npm run api:types` and commit `openapi.json` and `schema.d.ts` (unit tests
   fail while either is stale).
9. **Check**: run `npm run lint`, `npm run test` and `npm run test:e2e`; report results
   honestly.
