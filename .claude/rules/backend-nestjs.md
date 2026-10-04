---
paths:
  - 'apps/api/**'
---

# Backend (NestJS)

- One folder per feature under `apps/api/src/<feature>/` with its `<feature>.module.ts`, plus a
  `<feature>.controller.ts` when it exposes routes, and a `<feature>.service.ts` and `dto/` when
  it has logic or inputs (e.g. `follow-up/` only provides a context, `settings/` only a
  controller). Pure business logic goes in `<feature>/domain/` (`stats/domain/`,
  `skills/domain/`) with no NestJS or Prisma imports; rules the web app also needs go in
  `packages/domain` (`@openjobseekr/domain`).
- Every request body and query is a DTO validated with `class-validator`
  (`class-transformer` for types). Never read raw `req.body` or untyped query params.
- Controllers only map HTTP to service calls: no business logic, no Prisma, no try/catch
  for flow control. Only exception: the health controller passes `PrismaService` to the
  Terminus database indicator.
- Prisma is accessed only from services (through `PrismaService`). Every query on user data
  is scoped by `userId`.
- Errors are thrown as `new AppException(ErrorCode.X, detail?)`; status and title come from
  `ERROR_CATALOG`. No try/catch for flow control in services: Prisma errors (not found,
  duplicate, foreign key) are translated in one place (`common/prisma-errors.ts`) and the
  global `ProblemDetailsFilter` formats every response.
- Configuration comes from the validated config module, never from `process.env` directly.
