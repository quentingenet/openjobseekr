# OpenJobSeekR : prompts pour Claude Code (VS Code)

## Mode d'emploi (en français)

1. Crée un dossier `openjobseekr`, fais `git init` dedans et ouvre-le dans VS Code.
   La racine du dossier doit être la racine de l'espace de travail.
2. Copie à la racine de ce dossier les quatre fichiers déjà préparés :
   `CLAUDE.md`, `README.md`, `docker-compose.yml`, `schema.prisma`.
   Le `CLAUDE.md` va à la racine du dépôt (`openjobseekr/CLAUDE.md`).
   Le prompt 3 déplace `schema.prisma` vers `apps/api/prisma/`.
3. Lance Claude Code depuis cette racine. Tape `/memory` pour vérifier que `CLAUDE.md` est chargé.
4. Colle les prompts **un par un, dans l'ordre**. Pour chacun :
   - démarre en mode plan (Shift+Tab) et lis le plan avant de valider ;
   - une fois fini, lance `npm run check` toi-même et relis le diff ;
   - commite toi-même, puis tape `/clear` avant le prompt suivant.
5. Après le prompt 2, tu peux demander une relecture : « Use the code-reviewer subagent on the current diff ».

Les prompts sont en anglais, comme le projet.

---

## Prompt 0: plan only (paste once at the start)

```text
Read CLAUDE.md, README.md, docker-compose.yml and schema.prisma.

Working agreement for this whole project:
- Everything (code, comments, docs, commits, logs) is in English. UI text goes through i18n.
- Do NOT run git commit or git push. Tell me when a phase is ready to commit.
- Do NOT add dependencies that are not named in the prompt without asking me first.
- No GitHub Actions, no deployment, no hosting. Everything runs locally.
- Follow current official documentation for Prisma, NestJS, Vitest, MUI and i18next. Their
  configuration changes between versions: do not copy old snippets from memory.
- For EVERY feature or piece of code you implement: add or update the tests, then run
  `npm run lint` and the relevant tests before telling me it is done. Never skip or silence
  checks (no `.skip`, no `eslint-disable` without a written reason, no weakened assertion).
- After each phase, run `npm run check` and report the result honestly, including failures.

Do not write any code yet. Summarize the project in your own words, list the phases you
will go through based on the prompts I give you, and list any question or ambiguity you see.
```

---

## Prompt 1: repository scaffolding

```text
Create the monorepo skeleton. Plan first, then implement after I approve.

- npm workspaces: `apps/api` and `apps/web`. Node LTS, `.nvmrc`.
- Root `package.json` scripts: `dev:api`, `dev:web`, `lint`, `typecheck`, `test`,
  `test:e2e`, `check` (= lint + typecheck + test).
- Strict TypeScript in both apps, shared base tsconfig.
- ESLint (flat config, typescript-eslint) and Prettier shared at the root.
- Husky + lint-staged: pre-commit runs lint-staged; pre-push runs `npm run check`.
- `.gitignore` (node_modules, dist, .env, CLAUDE.local.md, .claude/settings.local.json,
  .claude/worktrees/).
- `.env.example` with: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB=openjobseekr,
  DATABASE_URL (port 5432), DATABASE_URL_TEST (port 5433, database openjobseekr_test),
  JWT_SECRET, JWT_EXPIRES_IN, FOLLOW_UP_DELAY_DAYS=7, PORT.
- `.vscode/extensions.json` recommending ESLint, Prettier, Prisma, Vitest Explorer and the
  Claude Code extension, and `.vscode/settings.json` with format on save.
- Follow the "Repository structure" section of CLAUDE.md for the layout. Do not create the
  NestJS or React apps yet, and do not create empty feature folders: only the workspace
  structure and tooling.

Verify: `npm install` works and `npm run lint` runs (even with nothing to lint).
```

---

## Prompt 2: Claude Code project configuration

```text
Set up the Claude Code configuration for this repository, following the structure described
in CLAUDE.md. Before writing any file, check the CURRENT Claude Code documentation for the
exact schema of `.claude/settings.json` (permissions and hooks), rules files frontmatter
(`paths`), subagents and skills. Do not guess the format.

Create:
1. `.claude/settings.json` (shared, committed):
   - allow: `npm run test`, `npm run test:e2e`, `npm run lint`, `npm run typecheck`,
     `npm run check`, `docker compose ps`, `docker compose logs`.
   - ask: `git commit`, `git push`, `docker compose down`.
   - deny: reading `.env`, `rm -rf`, `git push --force`.
   - hooks: after a file edit, run Prettier and `eslint --fix` on the edited file only;
     before a Bash command, run `.claude/hooks/validate-bash.sh`.
2. `.claude/hooks/validate-bash.sh`: blocks destructive commands (`rm -rf`, `git push --force`,
   `DROP DATABASE`, `docker volume rm`, `docker compose down -v`) with a clear message.
3. `.claude/rules/` (concise, one topic per file):
   - `backend-nestjs.md` with `paths: apps/api/**`: module layout, DTO validation, error codes,
     no business logic in controllers, Prisma access only in services.
   - `frontend-react.md` with `paths: apps/web/**`: no hardcoded UI text, TanStack Query for
     server state, MUI components, accessibility basics.
   - `testing.md`: Vitest everywhere, explicit expected values, test first for business logic,
     supertest default import, e2e files run sequentially. A feature or change is not done
     without its tests and a passing lint check (`npm run lint`).
   - `api-conventions.md`: error format `{ code, message, details? }`, enum codes in English,
     `jobPostingText` only in detail responses, dates as `YYYY-MM-DD`.
4. `.claude/agents/code-reviewer.md` (read-only tools): reviews a diff against CLAUDE.md and
   the rules above, reports problems by severity, never edits files.
5. `.claude/agents/security-auditor.md` (read-only tools): checks authentication, JWT handling,
   input validation, secrets handling, raw SQL usage.
6. `.claude/skills/new-endpoint/SKILL.md`: checklist to add an endpoint (DTO, service,
   controller, tests, Swagger decorators, error codes).

Keep CLAUDE.md as it is, except for correcting the commands list if needed.
Do not create `.mcp.json` or `AGENTS.md`.
Verify the hook scripts run and that `.claude/settings.json` is valid JSON.
```

---

## Prompt 3: API foundation

```text
Build the API foundation in `apps/api`. Plan first, then implement.

- NestJS (current version), strict TypeScript, Prisma with PostgreSQL.
- Move `schema.prisma` from the repository root to `apps/api/prisma/schema.prisma` and add the
  `generator` and `datasource` blocks according to the current Prisma documentation. Create
  the first migration. Do not change the models or enum values in the file.
- Config module with environment validation (Zod). Fail fast on missing variables.
- `PrismaService` and graceful shutdown.
- Global `ValidationPipe` (whitelist, forbid unknown values, transform).
- Global exception filter returning `{ code, message, details? }` with stable error codes
  (e.g. `VALIDATION_FAILED`, `UNAUTHORIZED`, `APPLICATION_NOT_FOUND`).
- Auth module: register, login, JWT access token, `JwtAuthGuard`, current-user decorator.
  Hash passwords with `bcrypt`. Never return the password hash.
- Health endpoint with `@nestjs/terminus` (database check).
- Swagger at `/docs` with `@nestjs/swagger`.
- Vitest for the API: `vitest.config.ts` (unit) and `vitest.config.e2e.ts` (include
  `**/*.e2e-spec.ts`, `fileParallelism: false`), using `unplugin-swc` and `@swc/core`
  because NestJS needs `emitDecoratorMetadata`. Make sure `tsconfig` has
  `emitDecoratorMetadata` and `experimentalDecorators`.
  In e2e tests use `import request from 'supertest'` (default import).
- E2E tests run against `DATABASE_URL_TEST` (docker service `db-test`), with the schema
  applied before the run and tables cleaned between tests.

Tests required in this phase: register + login, protected route returns 401 without a token,
validation error format, health endpoint.
Verify: `docker compose up -d db db-test`, then `npm run check` and `npm run test:e2e` pass.
```

---

## Prompt 4: applications, statistics and domain logic (tests first)

```text
Implement the core domain in `apps/api`. Write the tests first for the pure functions, show
me they fail, then implement. Plan first.

1. Pure domain functions (no NestJS, no database) in `apps/api/src/applications/domain/`:
   - `computeFollowUpDate(sentAt, status, delayDays)`: returns `sentAt + delayDays` while the
     status is `SENT`, otherwise `null`. Work on `YYYY-MM-DD` strings or UTC dates to avoid
     timezone off-by-one errors.
   - `isFollowUpOverdue(followUpDate, today)`: `today` is a parameter (no hidden clock).
   - `computeResponseRate(statuses)`: responses are all statuses except `SENT` and
     `NO_RESPONSE`; rate = responses / total, `null` when there are no applications.
2. Unit tests with explicit expected values taken from the original spreadsheet:
   - sent 2026-10-01, status SENT, delay 7 -> 2026-10-08
   - sent 2026-10-02, status SENT, delay 7 -> 2026-10-09
   - sent 2026-10-03, status SENT, delay 7 -> 2026-10-10
   - any status other than SENT -> null
   - overdue when today is after the follow-up date, not overdue on the follow-up date itself
   - response rate: 0 responses out of 6 -> 0; 2 responses out of 4 -> 0.5; empty list -> null
3. Applications module: full CRUD with DTOs for all `Application` fields, scoped to the
   authenticated user (a user can never read or modify another user's data).
   - List endpoint: filters `status`, `channel`, `overdue=true`, text search `q` on company and
     job title, pagination `limit` and `offset`, sorted by `sentAt` descending.
   - List responses exclude `jobPostingText`; the detail response includes it.
   - Responses include the computed `followUpDate` and `followUpOverdue`.
   - The follow-up delay comes from `FOLLOW_UP_DELAY_DAYS`.
4. Stats module: `GET /stats/overview` returns counts by status, counts by channel and the
   response rate.
5. Service tests and e2e tests: CRUD, filters, ownership isolation between two users,
   `jobPostingText` absent from lists, stats values on a small known dataset.

Verify: `npm run check` and `npm run test:e2e` pass. Report test counts.
```

---

## Prompt 5: web application with i18n

```text
Build the web app in `apps/web`. Plan first, then implement in small steps.

- Vite + React + TypeScript (strict), Material UI, TanStack Query, React Router,
  React Hook Form + Zod, i18next + react-i18next + i18next-browser-languagedetector.
- Generate TypeScript types from the API's OpenAPI document (`openapi-typescript`) and use a
  thin typed fetch wrapper. Do not duplicate API types by hand.
- Authentication: login and register pages, token kept in localStorage (local-only app,
  note the trade-off in `docs/decisions.md`), route protection.
- Pages: applications table (filters by status and channel, "follow-ups due" filter, search),
  application form covering all fields, application detail (with the job posting text),
  statistics page.
- i18n:
  - Locale files `en` and `fr` under `apps/web/src/locales/`. Default language from the
    browser, fallback `en`, choice persisted, language switcher in the app bar, and
    `<html lang>` kept in sync.
  - No hardcoded user-facing text anywhere.
  - Enum values are translated through keys (`status.SENT`, `channel.APEC`,
    `workMode.HYBRID`...). API error codes are translated through `errors.<CODE>` keys.
  - Dates and numbers formatted with `Intl` using the active language.
  - Pass the matching MUI locale to the theme (`@mui/material/locale`).
- Tests with Vitest + Testing Library + jsdom:
  - A parity test that fails if any translation key exists in one language and not the other.
  - A component test for the application form (validation messages shown in both languages).
  - A test that the language switcher changes the displayed text.

Verify: `npm run dev:api` and `npm run dev:web` work together, and `npm run check` passes.
```

---

## Prompt 6 (later): skills analysis and spreadsheet import

```text
Add two features to the API and web app. Plan first.

1. Skills module (maps to the spreadsheet tab "Compétences"):
   - CRUD for `Skill` (name, regex pattern, optional level 0-5).
   - `GET /skills/stats`: for each skill, the number of applications whose `jobPostingText`
     matches the pattern (case-insensitive) and the frequency over applications that have a
     posting text.
   - Reject invalid regular expressions with a validation error.
   - Tests with explicit expectations, including: `\bJava\b` must not match "JavaScript",
     and `SQL` patterns must not match "NoSQL" when written as `\bSQL\b`.
   - A web page listing skills sorted by frequency.
2. Spreadsheet import (CSV exported from the original sheet):
   - A single module owns the mapping from the sheet's French labels to the English enums
     (e.g. "Envoyée" -> SENT, "Entretien RH" -> HR_INTERVIEW, "Cabinet de recrutement" ->
     RECRUITMENT_AGENCY, "Hybride" -> HYBRID).
   - Dates in the sheet are `DD/MM/YYYY`.
   - Test with a small fixture of 3 rows covering the mapping and the date format.

Verify: `npm run check` and `npm run test:e2e` pass.
```

---

## Prompt 7: documentation

```text
Finish the documentation. Do not invent features that do not exist.

- Update README.md: real install, migrate, run and test commands, a short architecture
  overview, screenshots section left empty with a TODO, and an accurate feature list
  (mark planned features as planned).
- Create `docs/decisions.md`: a short decision log (5 to 10 lines per decision) covering why
  Prisma, why Vitest with SWC for NestJS, why a language-neutral API with i18n on the web side,
  why the follow-up date is computed and not stored, why local-only without CI, and the
  localStorage token trade-off.
- Do not choose a license: leave the README section as it is.

Verify: every command in the README runs as written.
```

---

## Après chaque phase (à coller dans une session neuve si tu veux une relecture)

```text
Review the current diff against CLAUDE.md and the rules in .claude/rules/. List problems by
severity (blocking, important, minor). Check that every changed behavior has a test and that
lint passes. Do not edit any file.
```
