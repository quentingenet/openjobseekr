import { isCalendarDate } from '@openjobseekr/domain';

const DAY_MS = 86_400_000;
/** Day 0 of each spreadsheet date system (the 1900 system counts from 1899-12-30). */
const EPOCH_1900 = Date.UTC(1899, 11, 30);
const EPOCH_1904 = Date.UTC(1904, 0, 1);

const DAY_FIRST = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

/**
 * A date cell as `YYYY-MM-DD`, or null when it is not a date. Spreadsheets store dates as day
 * numbers: converting them in UTC avoids the time zone shift of a JavaScript `Date`. Dates
 * typed as text are read as `DD/MM/YYYY` (the spreadsheet format) or `YYYY-MM-DD`.
 */
export function toCalendarDateCell(value: unknown, date1904: boolean): string | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) return null;
    const epoch = date1904 ? EPOCH_1904 : EPOCH_1900;
    return new Date(epoch + Math.floor(value) * DAY_MS).toISOString().slice(0, 10);
  }
  if (typeof value !== 'string') return null;
  const text = value.trim();
  const [, day, month, year] = DAY_FIRST.exec(text) ?? [];
  const iso =
    day && month && year ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : text;
  return isCalendarDate(iso) ? iso : null;
}
