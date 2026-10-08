import type { SpreadsheetFormat } from '@openjobseekr/domain';
import * as XLSX from 'xlsx';
import type { ExportCell, ExportSheet } from './domain/build-workbook.js';
import { toDateSerial } from './domain/spreadsheet-date.js';

export const SPREADSHEET_CONTENT_TYPES: Record<SpreadsheetFormat, string> = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
};

/** The date format of the spreadsheet. */
const DATE_FORMAT = 'dd/mm/yyyy';

/** `Listes!$B$3` or `Candidatures!R2:R40`: a cell or a range of another sheet. */
const SHEET_REFERENCE = /([A-Za-z_][\w]*)!(\$?[A-Z]+\$?\d+)(?::(\$?[A-Z]+\$?\d+))?/g;

/**
 * SheetJS converts formulas to OpenDocument but not references to another sheet
 * (`Listes!$B$3` must become `[$Listes.B3]`): they are converted here, and SheetJS leaves an
 * OpenDocument reference as it is. The `$` are dropped (SheetJS would rewrite them), which
 * changes nothing for a formula that is not copied.
 */
export function toOdsSheetReferences(formula: string): string {
  const relative = (cell: string) => cell.replaceAll('$', '');
  return formula.replace(
    SHEET_REFERENCE,
    (_, sheet: string, start: string, end?: string) =>
      `[$${sheet}.${relative(start)}${end ? `:.${relative(end)}` : ''}]`,
  );
}

/**
 * A cell for SheetJS. Text is always written as a text cell, never as a formula: a value such
 * as "=HYPERLINK(...)" typed in the app stays text in the file (no formula injection).
 */
function toCell(cell: ExportCell, format: SpreadsheetFormat): XLSX.CellObject | null {
  if (cell === null) return null;
  if (typeof cell === 'string') return { t: 's', v: cell };
  if (typeof cell === 'number') return { t: 'n', v: cell };
  if ('date' in cell) return { t: 'n', v: toDateSerial(cell.date), z: DATE_FORMAT };
  // The value shown until the spreadsheet recalculates, and the one the import reads.
  const { value, isDate } = cell;
  const formula = format === 'ods' ? toOdsSheetReferences(cell.formula) : cell.formula;
  if (value === null || value === '') return { t: 's', v: '', f: formula };
  if (typeof value === 'number') return { t: 'n', v: value, f: formula };
  return isDate
    ? { t: 'n', v: toDateSerial(value), z: DATE_FORMAT, f: formula }
    : { t: 's', v: value, f: formula };
}

function toWorksheet(
  { rows, columnWidths }: ExportSheet,
  format: SpreadsheetFormat,
): XLSX.WorkSheet {
  const sheet: XLSX.WorkSheet = {};
  let lastColumn = 0;
  rows.forEach((row, r) => {
    row.forEach((value, c) => {
      const cell = toCell(value, format);
      if (!cell) return;
      sheet[XLSX.utils.encode_cell({ r, c })] = cell;
      lastColumn = Math.max(lastColumn, c);
    });
  });
  sheet['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: Math.max(rows.length - 1, 0), c: lastColumn },
  });
  sheet['!cols'] = columnWidths.map((wch) => ({ wch }));
  return sheet;
}

/** Writes the sheets as an .xlsx or .ods file. */
export function writeSpreadsheet(sheets: ExportSheet[], format: SpreadsheetFormat): Buffer {
  const book = XLSX.utils.book_new();
  for (const sheet of sheets)
    XLSX.utils.book_append_sheet(book, toWorksheet(sheet, format), sheet.name);
  return XLSX.write(book, { bookType: format, type: 'buffer', compression: true }) as Buffer;
}
