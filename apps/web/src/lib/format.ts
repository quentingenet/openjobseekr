/** Formats a `YYYY-MM-DD` date for display, in the active language, without time zone shifts. */
export function formatDate(date: string, language: string): string {
  return new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00.000Z`),
  );
}

/** Formats an ISO timestamp (e.g. createdAt) in the user's time zone. */
export function formatDateTime(isoDate: string, language: string): string {
  return new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(isoDate),
  );
}

export function formatPercent(ratio: number, language: string): string {
  return new Intl.NumberFormat(language, { style: 'percent', maximumFractionDigits: 1 }).format(
    ratio,
  );
}

export function formatNumber(value: number, language: string): string {
  return new Intl.NumberFormat(language).format(value);
}
