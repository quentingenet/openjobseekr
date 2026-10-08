import { hasImportExtension, IMPORT_LIMITS } from '@openjobseekr/domain';

/** The upload limit in megabytes, as shown to the user. */
export const MAX_FILE_MEGABYTES = IMPORT_LIMITS.maxFileBytes / (1024 * 1024);

/** The empty templates served by the web app (`public/templates/`), one per format. */
export const IMPORT_TEMPLATES = [
  { format: '.xlsx', href: '/templates/suivi_candidatures_modele.xlsx' },
  { format: '.ods', href: '/templates/suivi_candidatures_modele.ods' },
] as const;

/**
 * Translation key of the reason why a chosen file cannot be sent, or null when it can. Only
 * a quick check before uploading: the API reads the file and has the last word.
 */
export function importFileProblem(
  file: Pick<File, 'name' | 'size'>,
): 'import.wrongExtension' | 'import.tooLarge' | null {
  if (!hasImportExtension(file.name)) return 'import.wrongExtension';
  if (file.size > IMPORT_LIMITS.maxFileBytes) return 'import.tooLarge';
  return null;
}

/** `Candidatures!B7` -> the sheet and the cell; a missing sheet is reported without a cell. */
export function splitCellField(field: string): { sheet: string; cell?: string } {
  const separator = field.lastIndexOf('!');
  return separator < 0
    ? { sheet: field }
    : { sheet: field.slice(0, separator), cell: field.slice(separator + 1) };
}
