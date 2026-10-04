# Testing

- Vitest everywhere (API, web). The API uses `unplugin-swc` for decorator metadata.
- Explicit expected values (`expect(result).toBe('2026-10-08')`); no snapshots for business
  logic.
- Business logic is written test first: write the failing test, run it, then implement.
- Unit tests sit next to the code as `*.spec.ts`; API e2e tests live in `apps/api/test/` as
  `*.e2e-spec.ts` and run sequentially (`fileParallelism: false`) against the test database.
- In e2e tests, use the default import: `import request from 'supertest'`.
- A feature or change is not done until its tests are added or updated, the relevant tests
  pass and `npm run lint` passes.
- Never skip or silence checks: no `.skip`/`.only`, no `eslint-disable` without a written
  reason, no weakened assertion to make a test pass.
