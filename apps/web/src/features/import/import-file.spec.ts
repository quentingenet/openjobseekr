import { IMPORT_LIMITS } from '@openjobseekr/domain';
import { describe, expect, it } from 'vitest';
import { importFileProblem, MAX_FILE_MEGABYTES, splitCellField } from './import-file';

describe('importFileProblem', () => {
  it('accepts an .xlsx or .ods file within the size limit', () => {
    expect(importFileProblem({ name: 'suivi.xlsx', size: 1_000 })).toBeNull();
    expect(importFileProblem({ name: 'suivi.ods', size: IMPORT_LIMITS.maxFileBytes })).toBeNull();
  });

  it('rejects other formats, then files above the limit', () => {
    expect(importFileProblem({ name: 'suivi.csv', size: 1_000 })).toBe('import.wrongExtension');
    expect(importFileProblem({ name: 'suivi.xlsx', size: IMPORT_LIMITS.maxFileBytes + 1 })).toBe(
      'import.tooLarge',
    );
  });

  it('shows the limit in megabytes', () => {
    expect(MAX_FILE_MEGABYTES).toBe(5);
  });
});

describe('splitCellField', () => {
  it('splits a cell reference reported by the API', () => {
    expect(splitCellField('Candidatures!B7')).toEqual({ sheet: 'Candidatures', cell: 'B7' });
    expect(splitCellField('My!Sheet!A1')).toEqual({ sheet: 'My!Sheet', cell: 'A1' });
  });

  it('keeps a sheet name alone', () => {
    expect(splitCellField('Compétences')).toEqual({ sheet: 'Compétences' });
  });
});
