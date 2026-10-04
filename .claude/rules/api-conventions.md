# API conventions

- Error responses always have the shape `{ code, message, details? }`: `code` is a stable
  UPPER_SNAKE_CASE identifier (e.g. `VALIDATION_FAILED`, `APPLICATION_NOT_FOUND`), `message`
  an English developer message, `details` optional structured data (e.g. field errors).
- Enum values are English codes (`SENT`, `HR_INTERVIEW`); the API never returns translated
  labels.
- `jobPostingText` is returned only by the detail endpoint, never in list responses.
- Dates without a time (e.g. `sentAt`, `followUpDate`) are `YYYY-MM-DD` strings, in requests
  and responses.
- The follow-up date is computed, never stored.
