/**
 * Spreadsheet import: the file replaces all the user's applications and skills. Only Excel and
 * OpenDocument workbooks are accepted (CSV has no sheets, so no skills tab).
 */
export const IMPORT_FILE_EXTENSIONS = ['.xlsx', '.ods'] as const;

export const IMPORT_LIMITS = {
  /** Upload size, checked by the web app before sending and enforced by the API. */
  maxFileBytes: 5 * 1024 * 1024,
  /** Total size of the files inside the archive (xlsx and ods files are zip archives). */
  maxUncompressedBytes: 100 * 1024 * 1024,
  maxApplications: 2_000,
  maxSkills: 500,
} as const;

export function hasImportExtension(fileName: string): boolean {
  const name = fileName.toLowerCase();
  return IMPORT_FILE_EXTENSIONS.some(
    (extension) => name.endsWith(extension) && name.length > extension.length,
  );
}

/**
 * Why a cell of an imported file was rejected: the API reports them (one per cell), the web app
 * translates them.
 */
export const IMPORT_CELL_CONSTRAINTS = [
  'missingSheet',
  'expectedHeader',
  'unexpectedColumn',
  'isNotEmpty',
  'maxLength',
  'isCalendarDate',
  'isIn',
  'isRegex',
  'isSkillLevel',
  'formulaError',
] as const;

export type ImportCellConstraint = (typeof IMPORT_CELL_CONSTRAINTS)[number];
