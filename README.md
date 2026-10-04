# OpenJobSeekR

**An open, community-driven app for anyone who wants to keep track of their job search.**

Looking for a job means juggling dozens of applications, follow-ups, interviews and job
postings. OpenJobSeekR keeps all of it in one place, reminds you when to follow up, and shows
which skills employers ask for most often, so you know what to learn next.

It is free software (GPL-3.0), runs entirely on your own machine, and your data never leaves
it. It was born from a real job search spreadsheet and is meant to grow with the people who
use it: ideas, translations, bug reports and pull requests are all welcome.

**Local-first, designed to be deployable**: it runs on `127.0.0.1` today, and is built with
what a hosted version would need (accounts, a standard error format).

> Status: work in progress, usable day to day.

## Features

- **Applications**: company, job title, location, channel, status, contact, work mode,
  remote rhythm, salary range, CV version, stack, recruitment process, notes and the full text
  of the job posting.
- **Applications table**: filters by status and channel, "follow-ups due" filter, search on
  company and job title, sort by sent date, pagination. Filters live in the URL, so the back
  button and bookmarks keep them.
- **Automatic follow-up date**: sent date + a configurable delay (7 days by default) while the
  application is waiting for an answer, with overdue follow-ups highlighted.
- **Channels**: LinkedIn, Welcome to the Jungle, APEC, HelloWork, recruitment agency, career
  site, referral, unsolicited, or "Other" with your own channel name (e.g. Indeed).
- **Statistics**: counts by status and by channel, and your response rate.
- **Skills analysis**: define the skills you want to track with a search pattern
  (e.g. `\bJava\b`, which does not match "JavaScript"). The app counts how many of your saved
  job postings mention each one, and updates as you add postings.
- **Languages**: English, French and Spanish, switchable at any time.
- **Accounts**: each user only ever sees their own data, ready for a shared or hosted setup.

## Tech stack

- **Web** (`apps/web`): React, TypeScript, Vite, Material UI, TanStack Query, React Router,
  React Hook Form + Zod, i18next
- **API** (`apps/api`): NestJS, TypeScript, Prisma, PostgreSQL, JWT authentication,
  OpenAPI documentation
- **Tests**: Vitest everywhere, Testing Library for the web app, Supertest for the API
  end-to-end tests
- **Tooling**: npm workspaces, ESLint, Prettier, Husky

## Getting started

### Requirements

- Node.js 24 (see `.nvmrc`; with fnm or nvm: `fnm use` / `nvm use`)
- PostgreSQL 17, installed locally or with Docker

### 1. Install

```bash
git clone https://github.com/quentingenet/openjobseekr.git
cd openjobseekr
npm install
cp .env.example .env
```

### 2. Database

**Option A: local PostgreSQL.** Create a role allowed to create databases; Prisma then creates
the `openjobseekr` and `openjobseekr_test` databases itself.

```bash
sudo -u postgres psql -c "CREATE ROLE openjobseekr LOGIN CREATEDB PASSWORD 'your-password';"
```

In `.env`, set the password in `DATABASE_URL` and `DATABASE_URL_TEST` (both on port 5432).

> On Fedora and other distributions, PostgreSQL may refuse password logins on localhost by
> default ("Ident authentication failed"): use `scram-sha-256` for the `host` lines of
> `pg_hba.conf`, then reload PostgreSQL.

**Option B: Docker.** `docker compose up -d db db-test` starts both databases; set
`DATABASE_URL_TEST` to port 5433 in `.env`.

Then set `JWT_SECRET` in `.env` to a random string of at least 32 characters
(e.g. `openssl rand -base64 48`), and apply the migrations:

```bash
npm run db:migrate --workspace apps/api
```

### 3. Run

```bash
npm run dev:api    # API on http://127.0.0.1:3000, OpenAPI docs on /docs
npm run dev:web    # web app on http://127.0.0.1:5173
```

Open http://127.0.0.1:5173 and create an account. Both servers only listen on your own
machine.

## Development

| Command                                   | What it does                                          |
| ----------------------------------------- | ----------------------------------------------------- |
| `npm run check`                           | Lint, type check and unit tests (run before a commit) |
| `npm run test`                            | Unit and component tests                              |
| `npm run test:e2e`                        | API end-to-end tests on the `_test` database          |
| `npm run lint` / `npm run format`         | ESLint / Prettier                                     |
| `npm run api:types`                       | Regenerate the web app's API types from the API       |
| `npm run db:migrate --workspace apps/api` | Create and apply database migrations                  |

The end-to-end tests empty the test database between tests and refuse to run unless its name
ends with `_test` and differs from the development database.

### Architecture

```text
packages/
└── domain/                 rules shared by the API and the web app: dates, follow-up, statuses
apps/
├── api/                    NestJS API
│   ├── prisma/             schema and migrations
│   ├── src/
│   │   ├── applications/   CRUD, filters, statistics (pure functions in domain/)
│   │   ├── skills/         skills and their frequency in job postings
│   │   ├── stats/          statistics by status and channel
│   │   ├── auth/           registration, login, JWT guard
│   │   └── common/         error format, validation, shared decorators
│   └── test/               end-to-end tests
└── web/                    React app
    └── src/
        ├── api/            typed client (types generated from the OpenAPI document)
        ├── features/       applications, skills, stats, auth
        └── locales/        en, fr, es
```

- The API is language-neutral: it returns codes (`SENT`, `APPLICATION_NOT_FOUND`) and the web
  app translates them. Errors are RFC 9457 problem details (`application/problem+json`) with a
  stable `code`.
- The follow-up date is computed, never stored.
- Skill patterns use RE2, the regular expression engine of Google Sheets: matching runs in
  linear time, so no pattern can freeze the API.
- Text lengths are validated by the web app, the API and database constraints.

## Contributing

OpenJobSeekR is open to everyone. You can help by:

- **Reporting a bug or suggesting a feature**: open an issue describing what you expected and
  what happened.
- **Adding a language**: copy `apps/web/src/locales/en/translation.json` to a new folder and
  translate it, then register the language in `apps/web/src/i18n.ts`, `theme.ts` (Material UI
  and date picker translations) and `locales/translations.spec.ts`, which checks that every key
  exists in every language.
- **Contributing code**: fork the repository, create a branch, and open a pull request.
  Every change comes with tests, and `npm run check` and `npm run test:e2e` must pass.
  Code, comments and commit messages are in English.

## License

OpenJobSeekR is free software, released under the
[GNU General Public License v3.0](LICENSE).
