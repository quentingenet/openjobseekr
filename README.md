# OpenJobSeekR

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-%23007FFF.svg?style=for-the-badge&logo=mui&logoColor=white)
![Node.js 24](https://img.shields.io/badge/node.js_24-%23339933.svg?style=for-the-badge&logo=nodedotjs&logoColor=white)
![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Vitest](https://img.shields.io/badge/vitest-%236E9F18.svg?style=for-the-badge&logo=vitest&logoColor=white)
![Built with Claude Code](https://img.shields.io/badge/built_with-Claude_Code-%23D97757.svg?style=for-the-badge&logo=claude&logoColor=white)
![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg?style=for-the-badge)

**An open, community-driven app for anyone who wants to keep track of their job search.**

Looking for a job means juggling dozens of applications, follow-ups, interviews and job
postings. OpenJobSeekR keeps all of it in one place, reminds you when to follow up, and shows
which skills employers ask for most often, so you know what to learn next.

> Status: actively developed and usable day to day.

## Why I built it

Many people track their job search in a spreadsheet. OpenJobSeekR started from one, and turned
its recurring pain points into features: a computed follow-up date, filters to see what needs
attention, response statistics, and an analysis of saved job postings showing which skills
companies ask for most often.

It is local-first on purpose: a job search holds personal data (contacts, salaries, notes), so
both servers listen on `127.0.0.1` and the data never leaves your machine. Accounts, standard
errors and rate-limited login prepare a hosted version, which would still need configurable
hosts, proxy settings and a shared rate-limit store. Free software (GPL-3.0), open to ideas.

## Built with Claude Code

I co-built OpenJobSeekR with [Claude Code](https://claude.com/claude-code), configured my own
way to work efficiently and safely on this codebase. Claude Code implements a significant part
of the code within these constraints; I remain responsible for the architecture, the product
decisions, the review and what gets merged. The configuration is part of the repository:

- [`CLAUDE.md`](CLAUDE.md) and [`.claude/rules/`](.claude/rules): the stack, the conventions
  and the definition of done (tests first for business logic, no skipped checks, every
  user-facing text translated).
- [`.claude/hooks/`](.claude/hooks): a hook that blocks destructive shell commands, itself
  tested by `npm run test:hooks`, and a formatter run after every edit.
- [`.claude/agents/`](.claude/agents): read-only reviewers for code and security.
- [`.claude/skills/`](.claude/skills): a step-by-step checklist to add an API endpoint.

## Features

- **Applications**: company, job title, location, channel, status, contact, work mode,
  remote rhythm, salary range, CV version, stack, recruitment process, notes and the full text
  of the job posting.
- **Applications table**: filters by status and channel, "follow-ups due" filter, search on
  company and job title, sort by sent date, pagination. Filters live in the URL, so the back
  button and bookmarks keep them.
- **Follow-up date**: sent date + a configurable delay (7 days by default) while the
  application is waiting for an answer, or a date you pick with the date picker; overdue
  follow-ups are highlighted.
- **Follow-ups done**: one click on "I followed up" (in the table, on a phone card or on the
  application page) schedules the next follow-up one delay later and counts it; a "2nd
  follow-up", "3rd follow-up"... badge shows where you stand. For 10 seconds the same button
  (and the notification) undoes it.
- **Channels**: LinkedIn, Welcome to the Jungle, APEC, HelloWork, Indeed, Free-Work,
  Licorne Society, recruitment agency, career site, referral, unsolicited, or "Other" with your
  own channel name (e.g. Monster).
- **Statistics**: counts by status and by channel, and your response rate.
- **Skills analysis**: define the skills you want to track with a search pattern
  (e.g. `\bJava\b`, which does not match "JavaScript"). The app counts how many of your saved
  job postings mention each one, and updates as you add postings. Each skill appears once:
  names are compared ignoring case and a ".js" suffix.
- **Spreadsheet import and export**: bring an existing job search spreadsheet (.xlsx or .ods)
  into the app, and download your data back in the same layout, see
  [Importing a spreadsheet](#importing-a-spreadsheet) and
  [Exporting a spreadsheet](#exporting-a-spreadsheet).
- **Languages**: English, French and Spanish, switchable at any time.
- **Accounts**: each user only ever sees their own data; login attempts are rate-limited.

## Importing a spreadsheet

The **Import** button of the applications page loads a spreadsheet kept in Excel, LibreOffice or
Google Sheets (downloaded as .xlsx or .ods). A confirmation dialog explains what happens before
anything is sent:

- **Applications are replaced**: all your current applications are permanently deleted and
  replaced by the rows of the file.
- **Follow-up dates are kept**: a follow-up date you picked in the app stays when the same
  application is found again in the file (same sent date, company and job title, ignoring case
  and spaces), so importing the sheet again never resets it. A date typed by hand in column J
  of the file wins; the formula's date never erases yours. The number of follow-ups done,
  which has no column in the file, is kept too.
- **Skills are added**: your skills (and their levels) are kept; a skill of the file is added
  only if you do not have it yet. Names are compared ignoring case and a ".js" suffix, so
  "TypeScript", "TYPESCRIPT" and "typescript" are one skill, and so are "React" and "React.js".
- **All or nothing**: the whole file is checked first. If a cell is invalid, nothing changes and
  the app lists the cells to fix (e.g. sheet "Candidatures", cell A3: invalid date). Formula
  errors (`#N/A`, `#REF!`...) are reported too, never imported as text.

Start from the empty template, which has the exact layout, the drop-down lists and the
follow-up date formula:
[`suivi_candidatures_modele.xlsx`](apps/web/public/templates/suivi_candidatures_modele.xlsx) or
[`suivi_candidatures_modele.ods`](apps/web/public/templates/suivi_candidatures_modele.ods)
(also downloadable from the import dialog).

The file must follow this layout. Column titles stay in French, as in the original spreadsheet;
case and extra spaces do not matter, but titles and their order do.

- **Format**: .xlsx or .ods only (CSV and legacy .xls are rejected), 5 MB at most, up to 2,000
  applications and 500 skills.
- **First sheet** (any name, "Candidatures" in the template): titles on row 1, one application
  per row from row 2, exactly these 18 columns:

  | Column | Title                    | Content                                                    |
  | ------ | ------------------------ | ---------------------------------------------------------- |
  | A      | `DATE ENVOI CANDIDATURE` | Required: a date cell, or text `DD/MM/YYYY`                |
  | B      | `ENTREPRISE`             | Required                                                   |
  | C      | `INTITULÉ OFFRE`         | Required                                                   |
  | D      | `LOCALISATION`           |                                                            |
  | E      | `RÉPONSE`                |                                                            |
  | F      | `RESSOURCES`             |                                                            |
  | G      | `CANAL`                  | A value of the channel list (see below)                    |
  | H      | `STATUT`                 | A value of the status list; empty means `Envoyée`          |
  | I      | `CONTACT (NOM / EMAIL)`  |                                                            |
  | J      | `DATE DE RELANCE`        | Kept only if it differs from sent date + delay (see below) |
  | K      | `REMOTE / HYBRIDE`       | A value of the work mode list                              |
  | L      | `RYTHME TÉLÉTRAVAIL`     |                                                            |
  | M      | `FOURCHETTE SALAIRE`     |                                                            |
  | N      | `VERSION CV / LETTRE`    |                                                            |
  | O      | `STACK / MOTS-CLÉS`      |                                                            |
  | P      | `PROCESS DE RECRUTEMENT` |                                                            |
  | Q      | `NOTES`                  |                                                            |
  | R      | `TEXTE DE L'ANNONCE`     | Used by the skills analysis                                |

- **"Compétences" sheet**: titles on row 3 (`COMPÉTENCE`, `TERME RECHERCHÉ`, `NB D'ANNONCES`,
  `FRÉQUENCE`, `NIVEAU ACTUEL (0-5)`, `SCORE DE PRIORITÉ`, `RANG`), one skill per row from
  row 4. Only the name (A), the pattern (B, an RE2 regular expression) and the level (E, a whole
  number from 0 to 5 or empty) are read; the other columns are computed by the spreadsheet.
- **Allowed values** (the "Listes" sheet of the template):
  - Status: Envoyée, Réponse reçue, Entretien RH, Entretien technique, Offre, Refus,
    Sans réponse
  - Channel: Site carrière, LinkedIn, Welcome to the Jungle, Hellowork, Apec, Indeed,
    Free-Work, Licorne Society, Cabinet de recrutement, Candidature spontanée, Cooptation,
    Autre
  - Work mode: Présentiel, Hybride, Full remote, Non précisé

The follow-up date of column J is compared with the sent date + the app's follow-up delay
(`FOLLOW_UP_DELAY_DAYS`, 7 days by default, like the template's formula): an equal date stays
computed (or keeps the date you picked in the app), a different one is kept as a date you
picked. If your sheet uses another delay, set
the same one in `.env` before importing.

Other sheets (dashboard, notes...) are ignored. Your own spreadsheet is never committed: the
repository ignores spreadsheet files, except these empty templates.

## Exporting a spreadsheet

The **Export** button of the applications page downloads your applications and skills as an
.xlsx (Excel, Google Sheets) or .ods (LibreOffice) file named `suivi_candidatures_<date>`. It
has exactly the layout the import reads, so you can edit it and import it again: exporting then
importing gives back the same data.

- **"Candidatures"**: the 18 columns, oldest application first, with the list labels of the
  spreadsheet. A precision of the "Autre" channel is written in parentheses
  (`Autre (Monster)`), which the import reads back.
- **Follow-up date (column J)**: the spreadsheet formula (sent date + the delay of the "Listes"
  sheet, while the status is `Envoyée`), or the date you picked as a plain date.
- **"Compétences"**: name, pattern and level, the number of job postings and the frequency
  computed by the app, and the priority score and rank as formulas.
- **"Listes"**: the follow-up delay and the allowed values.

The number of follow-ups done is not exported (the spreadsheet has no column for it); importing
the file again keeps it.

Drop-down lists and colors are not written (SheetJS does not support them): start from the
template if you want them, and paste the exported rows into it.

## Tech stack

- **Web** (`apps/web`): React, TypeScript, Vite, Material UI, TanStack Query, React Router,
  React Hook Form + Zod, i18next, openapi-fetch (API client typed from the OpenAPI document)
- **API** (`apps/api`): NestJS, TypeScript, Prisma, PostgreSQL, JWT authentication,
  OpenAPI documentation, SheetJS (reads and writes .xlsx and .ods files)
- **Tests**: Vitest everywhere, Testing Library for the web app, Supertest for the API
  end-to-end tests
- **Tooling**: npm workspaces, ESLint (typescript-eslint `strictTypeChecked`), Prettier, Husky

## Getting started

### Requirements

- Node.js 24 (see `.nvmrc`; with fnm or nvm: `fnm use` / `nvm use`)
- PostgreSQL 16 or later, installed locally or with Docker (the Compose file uses 17)

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
| `npm run check`                           | Lint, type check, unit and hook tests (run on push)   |
| `npm run test`                            | Unit and component tests                              |
| `npm run test:e2e`                        | API end-to-end tests on the `_test` database          |
| `npm run lint` / `npm run format`         | ESLint / Prettier                                     |
| `npm run api:types`                       | Regenerate the web app's API types after a DTO change |
| `npm run db:migrate --workspace apps/api` | Create and apply database migrations                  |

`npm run dev:api` compiles `packages/domain` once at startup: restart it after changing the
shared rules (tests and the web app pick up changes immediately).

The end-to-end tests empty the test database between tests and refuse to run unless its name
ends with `_test` and differs from the development database.

### Architecture

```text
packages/
└── domain/                 rules shared by the API and the web app: dates, follow-up, enums, limits
apps/
├── api/                    NestJS API
│   ├── prisma/             schema and migrations
│   ├── src/
│   │   ├── applications/   CRUD, filters, sort and pagination
│   │   ├── skills/         skills and their frequency in job postings
│   │   ├── spreadsheet/    spreadsheet import and export (.xlsx, .ods), format rules in domain/
│   │   ├── stats/          statistics by status and channel (pure functions in domain/)
│   │   ├── follow-up/      today's date and follow-up delay, shared by two modules
│   │   ├── auth/           registration, login, JWT guard, rate limiting
│   │   ├── settings/       settings the web app needs (follow-up delay)
│   │   ├── health/         health check (database included)
│   │   ├── config/         environment validation
│   │   ├── prisma/         Prisma module and service
│   │   └── common/         error format and Prisma error translation, validation, decorators
│   └── test/               end-to-end tests
└── web/                    React app
    └── src/
        ├── api/            typed client (types generated from the OpenAPI document)
        ├── features/       applications, skills, stats, spreadsheet (import, export), auth
        └── locales/        en, fr, es
```

### Engineering decisions

- **API contract generated from the code**: the NestJS DTOs produce the OpenAPI document, the
  web app's API types are generated from it, and tests fail when a copy is stale.
- **Shared domain rules**: the follow-up date, the channel precision, enums and limits are
  defined once in `packages/domain` and used by both the API and the web app.
- **Defense in depth**: lengths are checked by the forms, the API and database constraints;
  tests compare the API documentation and the real constraints with the shared limits.
- **Language-neutral API**: stable codes (`SENT`, `APPLICATION_NOT_FOUND`) and RFC 9457
  errors, translated by the web app. The follow-up date is computed, unless the user picked one:
  only that choice is stored.
- **Safe patterns**: skill patterns use RE2 (linear time, as in Google Sheets): none can hang.
- **AI-assisted, test-guarded**: generated code passes the same lint and tests as my own code.

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
