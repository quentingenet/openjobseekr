import {
  addDays,
  type ApplicationChannel,
  type ApplicationStatus,
  type ApplicationTextField,
  IMPORT_LIMITS,
  type ImportCellConstraint,
  SKILL_LEVEL,
  SKILL_LIMITS,
  TEXT_LIMITS,
  type WorkMode,
} from '@openjobseekr/domain';
import { isValidSkillPattern } from '../../skills/domain/skill-pattern.js';
import {
  APPLICATION_COLUMNS,
  APPLICATIONS_SHEET_NAME,
  CHANNEL_LABELS,
  normalizeLabel,
  SKILL_COLUMN,
  SKILL_HEADERS,
  SKILLS_HEADER_ROW,
  SKILLS_SHEET_NAME,
  STATUS_LABELS,
  WORK_MODE_LABELS,
} from './import-format.js';
import { toCalendarDateCell } from './spreadsheet-date.js';

/** A cell whose formula failed (`#N/A`, `#REF!`...), as displayed by the spreadsheet. */
export interface FormulaError {
  formulaError: string;
}

/**
 * A cell value as read from the file: text, number (dates are day numbers), a formula error,
 * or empty.
 */
export type CellValue = string | number | boolean | FormulaError | null;

export interface ImportSheet {
  name: string;
  /** Rows from row 1, cells from column A; missing trailing cells are empty. */
  rows: CellValue[][];
}

export interface ImportWorkbook {
  /** Dates count from 1904 instead of 1900 (old Mac Excel files). */
  date1904: boolean;
  sheets: ImportSheet[];
}

export interface CellError {
  sheet: string;
  /** e.g. `B7`; absent for a missing sheet. */
  cell?: string;
  constraint: ImportCellConstraint;
}

/** `channelDetail` is not a spreadsheet column: imported applications have none. */
export type ImportedApplication = Record<
  Exclude<ApplicationTextField, 'channelDetail'>,
  string | null
> & {
  sentAt: string;
  company: string;
  jobTitle: string;
  channel: ApplicationChannel | null;
  status: ApplicationStatus;
  /** The sheet's follow-up date when it differs from the computed one, otherwise null. */
  followUpOverride: string | null;
  workMode: WorkMode | null;
};

export interface ImportedSkill {
  /** Row in the sheet, to report the skills left out. */
  row: number;
  name: string;
  pattern: string;
  level: number | null;
}

export type ImportResult =
  | {
      ok: true;
      applications: ImportedApplication[];
      skills: ImportedSkill[];
    }
  | {
      ok: false;
      reason: 'invalidStructure' | 'invalidData' | 'tooManyRows';
      errors: CellError[];
    };

/** Enough to fix a file; a completely wrong file would otherwise report thousands of cells. */
export const MAX_REPORTED_ERRORS = 50;

export interface ParseOptions {
  /** The app's follow-up delay: a sheet date equal to sent date + delay is not stored. */
  followUpDelayDays: number;
  limits?: { maxApplications: number; maxSkills: number };
}

/** `0` -> `A`, `25` -> `Z`, `26` -> `AA`. */
function columnLetter(index: number): string {
  let letters = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters;
  }
  return letters;
}

function cellAt(row: CellValue[] | undefined, column: number): CellValue {
  return row?.[column] ?? null;
}

function isFormulaError(value: CellValue): value is FormulaError {
  return typeof value === 'object' && value !== null;
}

/** Trimmed text of a cell, or null when it is empty. Numbers are kept as typed (`45000`). */
function cellText(value: CellValue): string | null {
  if (value === null) return null;
  const text = (isFormulaError(value) ? value.formulaError : String(value)).trim();
  return text === '' ? null : text;
}

/** Length as the database counts it (code points), like the API DTOs. */
function length(text: string): number {
  return Array.from(text).length;
}

function labelLookup<Code extends string>(labels: Record<Code, string>): Map<string, Code> {
  return new Map(
    (Object.entries(labels) as [Code, string][]).map(([code, label]) => [
      normalizeLabel(label),
      code,
    ]),
  );
}

const LABEL_LOOKUPS = {
  status: labelLookup(STATUS_LABELS),
  channel: labelLookup(CHANNEL_LABELS),
  workMode: labelLookup(WORK_MODE_LABELS),
};

class ErrorList {
  readonly items: CellError[] = [];

  add(sheet: string, constraint: ImportCellConstraint, row?: number, column?: number): void {
    if (this.items.length >= MAX_REPORTED_ERRORS) return;
    const cell =
      row === undefined || column === undefined ? undefined : `${columnLetter(column)}${row}`;
    this.items.push(cell === undefined ? { sheet, constraint } : { sheet, cell, constraint });
  }
}

/** Header cells that differ from `expected`, then any extra non-empty title after them. */
function checkHeaders(
  sheet: ImportSheet,
  headerRow: number,
  expected: readonly string[],
  errors: ErrorList,
): void {
  const row = sheet.rows[headerRow - 1] ?? [];
  expected.forEach((header, column) => {
    const actual = cellText(cellAt(row, column));
    if (actual === null || normalizeLabel(actual) !== normalizeLabel(header)) {
      errors.add(sheet.name, 'expectedHeader', headerRow, column);
    }
  });
  for (let column = expected.length; column < row.length; column++) {
    if (cellText(cellAt(row, column)) !== null) {
      errors.add(sheet.name, 'unexpectedColumn', headerRow, column);
    }
  }
}

/** Data rows (1-based number and cells) holding a value in at least one of `columns`. */
function dataRows(
  sheet: ImportSheet,
  firstRow: number,
  columns: readonly number[],
): { number: number; cells: CellValue[] }[] {
  return sheet.rows.flatMap((cells, index) => {
    const number = index + 1;
    if (number < firstRow) return [];
    const empty = columns.every((column) => cellText(cellAt(cells, column)) === null);
    return empty ? [] : [{ number, cells }];
  });
}

const APPLICATION_DATA_COLUMNS = APPLICATION_COLUMNS.flatMap((column, index) =>
  column.kind === 'followUp' ? [] : [index],
);
const SKILL_DATA_COLUMNS = Object.values(SKILL_COLUMN);

function parseApplication(
  sheet: string,
  row: { number: number; cells: CellValue[] },
  { date1904, followUpDelayDays }: { date1904: boolean; followUpDelayDays: number },
  errors: ErrorList,
): ImportedApplication {
  const application: Record<string, string | null> = {};
  let sheetFollowUp: string | null = null;
  APPLICATION_COLUMNS.forEach((column, index) => {
    const value = cellAt(row.cells, index);
    const text = cellText(value);
    const fail = (constraint: ImportCellConstraint) =>
      errors.add(sheet, constraint, row.number, index);
    if (isFormulaError(value)) return fail('formulaError');
    switch (column.kind) {
      case 'followUp': {
        if (text === null) return;
        sheetFollowUp = toCalendarDateCell(value, date1904);
        if (sheetFollowUp === null) fail('isCalendarDate');
        return;
      }
      case 'date': {
        if (text === null) return fail('isNotEmpty');
        const date = toCalendarDateCell(value, date1904);
        if (date === null) fail('isCalendarDate');
        application.sentAt = date;
        return;
      }
      case 'text':
        if (text === null && column.required) fail('isNotEmpty');
        else if (text !== null && length(text) > TEXT_LIMITS[column.field]) fail('maxLength');
        application[column.field] = text;
        return;
      case 'status':
      case 'channel':
      case 'workMode': {
        const code = text === null ? null : LABEL_LOOKUPS[column.kind].get(normalizeLabel(text));
        if (text !== null && code === undefined) fail('isIn');
        application[column.kind] = code ?? null;
        return;
      }
    }
  });
  // The sheet computes the same date with a formula: only a date changed by hand is kept.
  const computed = application.sentAt ? addDays(application.sentAt, followUpDelayDays) : null;
  // Values are validated above; the result is only used when no error was found.
  return {
    ...application,
    status: application.status ?? 'SENT',
    followUpOverride: sheetFollowUp === computed ? null : sheetFollowUp,
  } as unknown as ImportedApplication;
}

function parseLevel(value: CellValue): number | null | undefined {
  const text = cellText(value);
  if (text === null) return null;
  const level = Number(text);
  return Number.isInteger(level) && level >= SKILL_LEVEL.min && level <= SKILL_LEVEL.max
    ? level
    : undefined;
}

function parseSkill(
  sheet: string,
  row: { number: number; cells: CellValue[] },
  errors: ErrorList,
): ImportedSkill {
  const fail = (constraint: ImportCellConstraint, column: number) =>
    errors.add(sheet, constraint, row.number, column);
  /** The cell, or undefined once a formula error in it is reported. */
  const read = (column: number): Exclude<CellValue, FormulaError> | undefined => {
    const value = cellAt(row.cells, column);
    if (!isFormulaError(value)) return value;
    fail('formulaError', column);
    return undefined;
  };

  const nameCell = read(SKILL_COLUMN.name);
  const name = nameCell === undefined ? null : cellText(nameCell);
  if (nameCell !== undefined) {
    if (name === null) fail('isNotEmpty', SKILL_COLUMN.name);
    else if (length(name) > SKILL_LIMITS.name) fail('maxLength', SKILL_COLUMN.name);
  }

  // Kept as typed, like the API: spaces may be part of the pattern.
  const patternCell = read(SKILL_COLUMN.pattern);
  const pattern = patternCell === undefined || patternCell === null ? '' : String(patternCell);
  if (patternCell !== undefined) {
    if (pattern.trim() === '') fail('isNotEmpty', SKILL_COLUMN.pattern);
    else if (length(pattern) > SKILL_LIMITS.pattern) fail('maxLength', SKILL_COLUMN.pattern);
    else if (!isValidSkillPattern(pattern)) fail('isRegex', SKILL_COLUMN.pattern);
  }

  const levelCell = read(SKILL_COLUMN.level);
  const level = levelCell === undefined ? null : parseLevel(levelCell);
  if (level === undefined) fail('isSkillLevel', SKILL_COLUMN.level);

  return { row: row.number, name: name ?? '', pattern, level: level ?? null };
}

/**
 * Reads the applications (first sheet) and the skills ("Compétences" sheet) of a workbook in
 * the spreadsheet layout. All or nothing: any invalid cell rejects the whole file, so that an
 * import never replaces the user's data with part of it.
 */
export function parseWorkbook(
  workbook: ImportWorkbook,
  { followUpDelayDays, limits = IMPORT_LIMITS }: ParseOptions,
): ImportResult {
  const errors = new ErrorList();
  const [applicationSheet, ...otherSheets] = workbook.sheets;
  const skillSheet = otherSheets.find(
    (sheet) => normalizeLabel(sheet.name) === normalizeLabel(SKILLS_SHEET_NAME),
  );

  if (applicationSheet) {
    checkHeaders(
      applicationSheet,
      1,
      APPLICATION_COLUMNS.map((column) => column.header),
      errors,
    );
  } else {
    errors.add(APPLICATIONS_SHEET_NAME, 'missingSheet');
  }
  if (skillSheet) checkHeaders(skillSheet, SKILLS_HEADER_ROW, SKILL_HEADERS, errors);
  else errors.add(SKILLS_SHEET_NAME, 'missingSheet');

  if (!applicationSheet || !skillSheet || errors.items.length > 0) {
    return { ok: false, reason: 'invalidStructure', errors: errors.items };
  }

  const applicationRows = dataRows(applicationSheet, 2, APPLICATION_DATA_COLUMNS);
  const skillRows = dataRows(skillSheet, SKILLS_HEADER_ROW + 1, SKILL_DATA_COLUMNS);
  if (applicationRows.length > limits.maxApplications || skillRows.length > limits.maxSkills) {
    return { ok: false, reason: 'tooManyRows', errors: [] };
  }

  const applications = applicationRows.map((row) =>
    parseApplication(
      applicationSheet.name,
      row,
      { date1904: workbook.date1904, followUpDelayDays },
      errors,
    ),
  );
  const skills = skillRows.map((row) => parseSkill(skillSheet.name, row, errors));
  if (errors.items.length > 0) {
    return { ok: false, reason: 'invalidData', errors: errors.items };
  }
  return { ok: true, applications, skills };
}
