---
paths:
  - 'apps/web/**'
---

# Frontend (React)

- No hardcoded user-facing text: every label, message, title, placeholder and `aria-label`
  goes through `t('...')`, with the key added to both `locales/en` and `locales/fr`.
- Enums and API error codes are translated by key (`status.SENT`, `errors.<CODE>`).
- Server state lives in TanStack Query (queries and mutations in `api/` hooks); no
  `useEffect` + `fetch` and no copy of server data in local state.
- Use Material UI components and the theme (`theme.ts`) instead of custom CSS or raw HTML
  controls.
- Accessibility: every form field has a label, buttons and icon buttons have an accessible
  name, images have `alt`, interactive elements are keyboard reachable, and errors are
  announced next to their field.
- Dates and numbers are formatted with `Intl` in the active language.
