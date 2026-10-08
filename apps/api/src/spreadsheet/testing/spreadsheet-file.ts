import * as XLSX from 'xlsx';
import {
  APPLICATION_HEADERS,
  SKILL_HEADERS,
  SKILLS_SHEET_NAME,
} from '../domain/spreadsheet-format.js';
import type { CellValue } from '../domain/parse-workbook.js';

/** One application row from column titles to values; other columns are empty. */
export function applicationRow(values: Partial<Record<string, CellValue>>): CellValue[] {
  return APPLICATION_HEADERS.map((header) => values[header] ?? null);
}

/** A workbook in the spreadsheet layout, as uploaded by the user. */
export function spreadsheetFile(
  { applications = [], skills = [] }: { applications?: CellValue[][]; skills?: CellValue[][] } = {},
  bookType: 'xlsx' | 'ods' = 'xlsx',
): Buffer {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([[...APPLICATION_HEADERS], ...applications]),
    'Candidatures',
  );
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([['Annonces analysées'], [], [...SKILL_HEADERS], ...skills]),
    SKILLS_SHEET_NAME,
  );
  return XLSX.write(book, { bookType, type: 'buffer' }) as Buffer;
}
