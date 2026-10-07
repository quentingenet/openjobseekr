import { describe, expect, it } from 'vitest';
import { hasImportExtension, IMPORT_FILE_EXTENSIONS } from './import.js';

describe('hasImportExtension', () => {
  it('accepts Excel and OpenDocument spreadsheets, whatever the case', () => {
    expect(IMPORT_FILE_EXTENSIONS).toEqual(['.xlsx', '.ods']);
    expect(hasImportExtension('suivi_candidatures.xlsx')).toBe(true);
    expect(hasImportExtension('Suivi.ODS')).toBe(true);
  });

  it('rejects CSV, legacy Excel and names without an extension', () => {
    expect(hasImportExtension('export.csv')).toBe(false);
    expect(hasImportExtension('old.xls')).toBe(false);
    expect(hasImportExtension('xlsx')).toBe(false);
    expect(hasImportExtension('report.xlsx.csv')).toBe(false);
  });
});
