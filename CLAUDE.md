# OpenJobSeekR

Fully local job application tracker (technical name: `openjobseekr`). It mirrors the columns
of the author's Google Sheet; the data model lives in `apps/api/prisma/schema.prisma`.

## Stack

- Web (`apps/web`): React, TypeScript, Vite, Material UI, TanStack Query, react-i18next
- API (`apps/api`): NestJS, strict TypeScript, Prisma, PostgreSQL
- Tests: Vitest everywhere (NestJS needs `unplugin-swc`), Supertest for e2e API tests
- Database: Docker Compose (`db` for development, `db-test` for e2e tests)
- No GitHub CI, no deployment: everything runs locally

## Repository structure

```text
openjobseekr/
├── CLAUDE.md, README.md, docker-compose.yml, .env.example
├── package.json              (npm workspaces + scripts), tsconfig.base.json, eslint.config.js
├── .vscode/                  (extensions.json, settings.json)
├── .claude/                  (settings.json, rules/, hooks/, agents/, skills/)
├── docs/decisions.md
└── apps/
    ├── api/
    │   ├── prisma/           (schema.prisma, migrations/)
    │   ├── src/
    │   │   ├── main.ts, app.module.ts
    │   │   ├── config/       (environment validation)
    │   │   ├── common/       (exception filter, decorators, error codes)
    │   │   ├── prisma/       (module and service)
    │   │   ├── auth/, health/, stats/
    │   │   ├── applications/ (domain/, dto/, controller, service, module)
    │   │   └── skills/, sheet-import/   (v2)
    │   ├── test/             (e2e tests and helpers)
    │   └── vitest.config.ts, vitest.config.e2e.ts
    └── web/
        └── src/
            ├── main.tsx, i18n.ts, theme.ts
            ├── api/          (typed client, generated types, hooks)
            ├── components/   (shared components)
            ├── features/     (auth/, applications/, stats/, skills/)
            ├── locales/      (en/translation.json, fr/translation.json)
            └── test/
```

- One folder per feature, on both the API and the web side.
- Pure business logic lives in `applications/domain/`: no NestJS or Prisma imports there.
- Unit tests sit next to the code (`*.spec.ts`); e2e tests live in `apps/api/test/`.
- Create folders only when a feature needs them.

## Commands (adjust once the scripts exist)

- `docker compose up -d db db-test`: start PostgreSQL
- `npm run dev:api` / `npm run dev:web`: run the API and the web app
- `npm run test`: unit tests; `npm run test:e2e`: API tests against `db-test`
- `npm run check`: lint + typecheck + tests, run before every commit

## Language and i18n

- All code, identifiers, comments, commit messages, documentation and logs are in English.
- The UI is translated with i18next (English and French). Never hardcode user-facing text:
  use translation keys, with `en` and `fr` files kept in sync.
- The API is language-neutral: enums are English codes, errors carry a stable `code`
  (e.g. `APPLICATION_NOT_FOUND`) plus an English developer message. The web app translates codes.
- Mapping from the spreadsheet's French labels to the English enums lives in one place,
  the spreadsheet import module.

## Conventions

- `Application` fields follow the spreadsheet columns: do not rename or reorder them.
- The follow-up date is not stored: it is computed (sent date + delay) while the status is `SENT`.
- `jobPostingText` is excluded from list responses and only returned in the detail response.
- Inputs are validated by DTOs (`class-validator`); no business logic in controllers.
- Tests: explicit expected values, no snapshots for business logic.
  In e2e tests, use the default import: `import request from 'supertest'`.
- A Vitest test checks that every translation key exists in both `en` and `fr`.

## Definition of done

- Every feature or code change comes with tests (new or updated) and a lint check.
  Run `npm run lint` and the relevant tests before saying the work is done.
- Tests pass and `npm run check` is green.
- Every added behavior has its test.
- Never skip or silence checks: no `.skip`, no `eslint-disable` without a written reason,
  no weakened assertion to make a test pass.
- If a check fails, report it honestly and fix the cause instead of working around it.

## Way of working

- Talk to the user in French; everything in the codebase (code, comments, commits, docs) stays in English.
- For any non-trivial change, propose a plan before writing code.
- For business logic, write the test first.
