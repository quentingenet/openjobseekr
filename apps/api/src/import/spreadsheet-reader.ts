import { IMPORT_LIMITS } from '@openjobseekr/domain';
import * as XLSX from 'xlsx';
import type { CellValue, ImportSheet, ImportWorkbook } from './domain/parse-workbook.js';

type SpreadsheetKind = 'xlsx' | 'ods';

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_ENTRY_SIGNATURE = 0x02014b50;
const EOCD_MIN_SIZE = 22;
const ZIP64_MARKER = 0xffffffff;

/**
 * Lists the entries of a zip archive (xlsx and ods files are zip archives) with their declared
 * uncompressed size, from its central directory. Returns null for anything else, including
 * zip64 archives, which no spreadsheet of a few megabytes needs.
 */
function zipEntries(file: Buffer): { name: string; size: number }[] | null {
  const lowest = Math.max(0, file.length - EOCD_MIN_SIZE - 0xffff);
  let eocd = -1;
  for (let offset = file.length - EOCD_MIN_SIZE; offset >= lowest; offset--) {
    if (file.readUInt32LE(offset) === EOCD_SIGNATURE) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) return null;
  const count = file.readUInt16LE(eocd + 10);
  let offset = file.readUInt32LE(eocd + 16);
  const entries: { name: string; size: number }[] = [];
  for (let index = 0; index < count; index++) {
    if (offset + 46 > file.length || file.readUInt32LE(offset) !== CENTRAL_ENTRY_SIGNATURE) {
      return null;
    }
    const size = file.readUInt32LE(offset + 24);
    const nameLength = file.readUInt16LE(offset + 28);
    const extraLength = file.readUInt16LE(offset + 30);
    const commentLength = file.readUInt16LE(offset + 32);
    if (size === ZIP64_MARKER) return null;
    entries.push({ name: file.toString('utf8', offset + 46, offset + 46 + nameLength), size });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

/** The workbook format of an archive: an xlsx has `xl/workbook.xml`, an ods a `mimetype`. */
function spreadsheetKind(names: Set<string>): SpreadsheetKind | null {
  if (names.has('[Content_Types].xml') && names.has('xl/workbook.xml')) return 'xlsx';
  if (names.has('mimetype') && names.has('content.xml')) return 'ods';
  return null;
}

function cellValue(cell: XLSX.CellObject | undefined): CellValue {
  switch (cell?.t) {
    case 's':
    case 'n':
    case 'b':
      return cell.v as CellValue;
    // A formula error (#N/A, #REF!...): never imported as text, the validation rejects it.
    case 'e':
      return { formulaError: cell.w ?? '#ERROR' };
    default:
      return null;
  }
}

function toImportSheet(name: string, sheet: XLSX.WorkSheet): ImportSheet {
  const data = (sheet['!data'] ?? []) as (XLSX.CellObject[] | undefined)[];
  const rows = Array.from(data, (row) => {
    const cells = Array.from(row ?? [], (cell) => cellValue(cell));
    // Trailing empty cells carry no information: `[]` for an empty row.
    while (cells.length > 0 && cells.at(-1) === null) cells.pop();
    return cells;
  });
  return { name, rows };
}

/**
 * Reads an .xlsx or .ods file into plain cell values, or returns null when the file is not a
 * spreadsheet of the format its name announces (a renamed CSV, a legacy .xls, a corrupted or
 * oversized archive). Formulas are not evaluated: their last computed values are read.
 */
export function readSpreadsheet(
  file: Buffer,
  fileName: string,
  { maxUncompressedBytes = IMPORT_LIMITS.maxUncompressedBytes } = {},
): ImportWorkbook | null {
  const entries = zipEntries(file);
  if (!entries) return null;
  const kind = spreadsheetKind(new Set(entries.map((entry) => entry.name)));
  if (!kind || !fileName.toLowerCase().endsWith(`.${kind}`)) return null;
  // Protection against zip bombs (a few megabytes expanding to gigabytes in memory), based on
  // the sizes the archive declares; the upload size limit bounds the rest.
  const uncompressed = entries.reduce((total, entry) => total + entry.size, 0);
  if (uncompressed > maxUncompressedBytes) return null;

  let book: XLSX.WorkBook;
  try {
    book = XLSX.read(file, {
      type: 'buffer',
      dense: true,
      cellFormula: false,
      cellHTML: false,
      cellStyles: false,
      bookVBA: false,
    });
  } catch {
    return null;
  }
  return {
    date1904: book.Workbook?.WBProps?.date1904 === true,
    sheets: book.SheetNames.flatMap((name) => {
      const sheet = book.Sheets[name];
      return sheet ? [toImportSheet(name, sheet)] : [];
    }),
  };
}
