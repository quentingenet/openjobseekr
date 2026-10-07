# API conventions

- Error responses are RFC 9457 problem details (`application/problem+json`):
  `{ type, title, status, detail?, instance, code, errors? }`. `code` is a stable
  UPPER_SNAKE_CASE identifier (e.g. `VALIDATION_FAILED`, `APPLICATION_NOT_FOUND`) translated by
  the web app, `type` is `urn:openjobseekr:error:<code in kebab-case>` (e.g.
  `application-not-found`), `errors` lists invalid fields.
- Status and title of each code are defined once, in `ERROR_CATALOG` (`common/error-codes.ts`).
- Enum values are English codes (`SENT`, `HR_INTERVIEW`); the API never returns translated
  labels.
- `jobPostingText` is returned only by the detail endpoint, never in list responses.
- Dates without a time (e.g. `sentAt`, `followUpDate`, `followUpOverride`) are `YYYY-MM-DD` strings, in requests
  and responses.
- The follow-up date (`followUpDate`) is computed while the status is `SENT`: the date set by
  the user (`followUpOverride`, `null` to go back to the computed date), or sent date + delay.
