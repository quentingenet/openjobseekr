# OpenJobSeekR

A local-first job application tracker. Keep every application, follow-up date, recruitment
process and job posting in one place, and see which skills come up most often in the
postings you save.

> Status: work in progress.

## Why

The data model mirrors a spreadsheet used during a real job search: one row per application
with company, job title, channel, status, work mode, salary range, recruitment process,
notes and the full text of the posting. OpenJobSeekR turns that spreadsheet into an API and a
web app, and adds what a spreadsheet does poorly: computed follow-up dates, per-channel
statistics and skill frequency across postings.

## Features

- Track applications with status, channel, contact, salary range and notes
- Follow-up date computed automatically (sent date + delay) while an application is waiting
- Statistics by status and channel, including response rate
- Skill analysis from saved job posting texts (planned)
- Import from the original spreadsheet (planned)
- English and French interface, switchable at runtime

## Tech stack

- **Web:** React, TypeScript, Vite, Material UI, TanStack Query, react-i18next
- **API:** NestJS, TypeScript, Prisma, PostgreSQL
- **Tests:** Vitest (unit, component) and Supertest (API end-to-end)
- **Tooling:** Docker Compose for local PostgreSQL, ESLint, Prettier, Husky

## Internationalization

The interface is available in English and French. Translations live in locale files and
are loaded by i18next. The API is language-neutral: it returns enum codes and error codes,
and the web app translates them.

## Getting started

```bash
cp .env.example .env        # set POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
docker compose up -d db db-test
```

Install, migration and run scripts will be documented here as they are added.

## License

To be defined before the first public release.
