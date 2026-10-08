# OpenJobSeekR

Local-first job application tracker (technical name: `openjobseekr`). It mirrors the columns of a
job search spreadsheet (Google Sheets); the data model lives in `apps/api/prisma/schema.prisma`.

## Stack

- Web (`apps/web`): React, TypeScript, Vite, Material UI (+ MUI X DatePicker with dayjs),
  TanStack Query, React Router (data router), React Hook Form + Zod, react-i18next,
  openapi-fetch (typed API client on the generated `schema.d.ts`)
- API (`apps/api`): NestJS 12 (ESM), strict TypeScript, Prisma 7 (`@prisma/adapter-pg`),
  PostgreSQL, RE2 (`re2`) for skill patterns, SheetJS (`xlsx`) to read imported spreadsheets:
  installed from `cdn.sheetjs.com`, as SheetJS recommends (the npm `xlsx` package is
  unmaintained and has known vulnerabilities)
- Shared domain (`packages/domain`, `@openjobseekr/domain`): pure TypeScript, no dependencies
- Tests: Vitest everywhere (NestJS needs `unplugin-swc`), Supertest for e2e API tests
- Database: the local PostgreSQL service on port 5432 (`openjobseekr` for development,
  `openjobseekr_test` for e2e tests). `docker-compose.yml` remains an alternative (test on 5433).
- Node 24 (`.nvmrc`). No GitHub CI and not deployed yet: everything runs locally on `127.0.0.1`

## Repository structure

```text
openjobseekr/
├── CLAUDE.md, README.md, docker-compose.yml, .env.example
├── package.json              (npm workspaces + scripts), tsconfig.base.json, eslint.config.js
├── .vscode/                  (extensions.json, settings.json)
├── .claude/                  (settings.json, rules/, hooks/, agents/, skills/)
├── packages/
│   └── domain/               (@openjobseekr/domain: business rules shared by api and web)
└── apps/
    ├── api/
    │   ├── prisma/           (schema.prisma, migrations/)
    │   ├── src/
    │   │   ├── main.ts, app.module.ts
    │   │   ├── config/       (environment validation)
    │   │   ├── common/       (exception filter, error codes, Prisma errors, decorators, clock)
    │   │   ├── prisma/       (module and service)
    │   │   ├── auth/, health/, settings/
    │   │   ├── follow-up/    (FollowUpModule: follow-up context for applications and settings)
    │   │   ├── applications/ (dto/, mapper, controller, service, module)
    │   │   ├── stats/        (domain/, dto/, controller, service, module)
    │   │   ├── skills/       (domain/, dto/, controller, service, module)
    │   │   ├── spreadsheet/  (.xlsx/.ods import and export: domain/ format rules, SheetJS reader
    │   │   │                 and writer, services)
    │   │   ├── generated/    (Prisma client, generated, not versioned)
    │   │   └── export-openapi.ts (writes the OpenAPI document used by the web app)
    │   ├── test/             (e2e tests and helpers)
    │   └── vitest.config.ts, vitest.config.e2e.ts
    └── web/
        └── src/
            ├── main.tsx, i18n.ts, theme.ts
            ├── api/          (typed client, queries/, domain-enums.check.ts,
            │                 openapi.json + schema.d.ts generated)
            ├── components/   (shared components)
            ├── lib/          (formatting, error and form helpers)
            ├── features/     (auth/, applications/, stats/, skills/, spreadsheet/)
            ├── locales/      (en/, fr/, es/ translation.json)
            └── test/
```

- One folder per feature, on both the API and the web side.
- Pure business logic lives in `<feature>/domain/` (stats, skills): no NestJS or
  Prisma imports there. Rules the web app also needs (calendar dates, follow-up date,
  enums, limits) live in `packages/domain` (`@openjobseekr/domain`), pure TypeScript without
  dependencies: never duplicate them in an app.
- Tools load `@openjobseekr/domain` from its sources (`source` export condition); only the
  compiled API needs its `dist/`, built once by the API `dev` and `build` scripts. After
  changing `packages/domain`, restart `npm run dev:api`: its watch mode only covers
  `apps/api/src`.
- Unit tests sit next to the code (`*.spec.ts`); e2e tests live in `apps/api/test/`.
- Create folders only when a feature needs them.

## Commands

- `npm run dev:api` / `npm run dev:web`: run the API (port 3000, `/docs`) and the web app
  (port 5173, proxies `/api` to the API)
- `npm run test`: unit tests; `npm run test:e2e`: API tests against `DATABASE_URL_TEST`
- `npm run test:hooks`: tests the Bash hook that blocks destructive commands
  (`.claude/hooks/validate-bash.sh`, a denylist: never complete, commits and pushes also ask)
- `npm run check`: lint + typecheck + tests + hook tests; run it before committing. Git hooks:
  pre-commit runs lint-staged, pre-push runs `check`.
- `npm run db:migrate --workspace apps/api`: create/apply migrations; then
  `npx prisma generate` in `apps/api` (Prisma 7 no longer generates after migrating)
- `npm run api:types`: regenerate the web API types after any API DTO change (unit tests
  fail while `apps/web/src/api/openapi.json` or `schema.d.ts` is stale)

## Language and i18n

- All code, identifiers, comments, commit messages, documentation and logs are in English.
- The UI is translated with i18next (English, French, Spanish). Never hardcode user-facing
  text: use translation keys, with `en`, `fr` and `es` files kept in sync.
- The API is language-neutral: enums are English codes, errors are RFC 9457 problem details
  with a stable `code` (e.g. `APPLICATION_NOT_FOUND`). The web app translates codes.

## Conventions

- `Application` fields follow the spreadsheet columns: do not rename or reorder them. The only
  addition is `channelDetail`, the channel name when `channel` is `OTHER` (cleared otherwise,
  by `channelDetailFor` in `@openjobseekr/domain`). `followUpOverride` holds the "DATE DE
  RELANCE" column only when the user set it by hand.
- The follow-up date exists only while the status is `SENT`: the date the user picked
  (`followUpOverride`, the only stored part) or else sent date + delay, computed by
  `computeFollowUpDate` in `@openjobseekr/domain`. The overdue filter applies the same rule.
- `jobPostingText` is excluded from list responses and only returned in the detail response.
- ESLint runs typescript-eslint `strictTypeChecked` (type-aware). The few relaxed rules are
  in `eslint.config.js`, each with its reason; fix the code rather than adding exceptions.
- Inputs are validated by DTOs (`class-validator`); no business logic in controllers.
- Tests: explicit expected values, no snapshots for business logic.
  In e2e tests, use the default import: `import request from 'supertest'`.
- A Vitest test checks that every translation key exists in `en`, `fr` and `es`, and that every
  API error code has its `errors.<CODE>` translation.
- Limits are defined once in `@openjobseekr/domain` (`TEXT_LIMITS` per field, `SKILL_LIMITS`,
  `SKILL_LEVEL`, `SEARCH_MAX_LENGTH`, `CREDENTIAL_LIMITS`, page sizes, `MAX_OFFSET`) and used by
  the API DTOs and the web forms. The database CHECK constraints (migrations) repeat them,
  checked against the migrations by `text-limits.spec.ts` and against the real database by
  `database-constraints.e2e-spec.ts`. `IMPORT_LIMITS` (file size, rows) bound the spreadsheet
  import.
- The status waiting for an answer (`FOLLOW_UP_STATUS`) drives the follow-up date, the
  overdue filter and the response rate: never compare with `'SENT'` directly.
- Enum lists (statuses, channels, work modes) come from `@openjobseekr/domain` in the web app
  and the shared rules; the API DTOs use the Prisma enums (for validation and Swagger). Two
  `domain-enums.check.ts` files fail the typecheck when the domain drifts from Prisma (API)
  or from the OpenAPI types (web).
- Spreadsheet import and export: column titles, list labels (French, as in the original sheet)
  and the "Autre (precision)" channel cell live once in `spreadsheet/domain/spreadsheet-format.ts`,
  for both directions; a test checks that export then import gives back the same data. The
  export writes formulas in Excel syntax: references to another sheet are converted for .ods
  by the writer (SheetJS does not). The empty templates in `apps/web/public/templates/` must
  match them (`templates.spec.ts`): regenerate both templates when a column or a label changes
  (e.g. a new channel). An import replaces the user's applications, adds skills and keeps the
  follow-up dates picked in the app for the applications found again (`keepFollowUpDates`); the
  whole file is validated before anything is written.
- Skill names are unique per user ignoring case and a ".js" suffix (`skillNameKey`): checked
  on create, update and import.
- Login and registration are rate-limited per IP (`AUTH_RATE_LIMIT`, 5 per minute by default).
- Skill patterns are matched with RE2 (the engine of Google Sheets): linear time, no
  lookarounds or backreferences.
- Do not create or commit new Markdown files (docs, notes); existing ones are edited on request.

## Definition of done

- Every feature or code change comes with tests (new or updated) and a lint check.
  Run `npm run lint` and the relevant tests before saying the work is done.
- Tests pass and `npm run check` is green.
- Every added behavior has its test.
- Never skip or silence checks: no `.skip`, no `eslint-disable` without a written reason,
  no weakened assertion to make a test pass.
- If a check fails, report it honestly and fix the cause instead of working around it.

## Way of working

- Talk to the user in French; everything in the codebase (code, comments, commits, docs) stays
  in English.
- For any non-trivial change, propose a plan before writing code.
- For business logic, write the test first.
