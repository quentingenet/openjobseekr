import { describe, expect, it } from 'vitest';
import { ErrorCode } from '../common/error-codes.js';
import { importFailure } from './import-errors.js';

describe('importFailure', () => {
  it('reports invalid cells as fields named after the sheet and the cell', () => {
    const exception = importFailure({
      ok: false,
      reason: 'invalidData',
      errors: [
        { sheet: 'Candidatures', cell: 'A3', constraint: 'isCalendarDate' },
        { sheet: 'Compétences', cell: 'B4', constraint: 'isRegex' },
      ],
    });

    expect(exception.code).toBe(ErrorCode.IMPORT_INVALID_DATA);
    expect(exception.errors).toEqual([
      { field: 'Candidatures!A3', constraints: ['isCalendarDate'] },
      { field: 'Compétences!B4', constraints: ['isRegex'] },
    ]);
  });

  it('names a missing sheet by itself', () => {
    const exception = importFailure({
      ok: false,
      reason: 'invalidStructure',
      errors: [{ sheet: 'Compétences', constraint: 'missingSheet' }],
    });

    expect(exception.code).toBe(ErrorCode.IMPORT_INVALID_STRUCTURE);
    expect(exception.errors).toEqual([{ field: 'Compétences', constraints: ['missingSheet'] }]);
  });

  it('has no field list for too many rows', () => {
    const exception = importFailure({ ok: false, reason: 'tooManyRows', errors: [] });

    expect(exception.code).toBe(ErrorCode.IMPORT_TOO_MANY_ROWS);
    expect(exception.errors).toBeUndefined();
  });
});
