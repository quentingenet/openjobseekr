---
paths:
  - 'apps/api/**'
---

# Backend (NestJS)

- One module per feature under `apps/api/src/<feature>/`: `<feature>.module.ts`,
  `<feature>.controller.ts`, `<feature>.service.ts`, `dto/`. Pure business logic goes in
  `applications/domain/` with no NestJS or Prisma imports.
- Every request body and query is a DTO validated with `class-validator`
  (`class-transformer` for types). Never read raw `req.body` or untyped query params.
- Controllers only map HTTP to service calls: no business logic, no Prisma, no try/catch
  for flow control.
- Prisma is accessed only from services (through `PrismaService`). Every query on user data
  is scoped by `userId`.
- Errors are thrown with a stable code from `common/` (e.g. `APPLICATION_NOT_FOUND`) and an
  English developer message; the global exception filter formats the response.
- Configuration comes from the validated config module, never from `process.env` directly.
