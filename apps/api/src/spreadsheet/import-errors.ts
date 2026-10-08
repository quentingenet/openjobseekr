import { AppException } from '../common/app.exception.js';
import { ErrorCode } from '../common/error-codes.js';
import type { CellError, ImportResult } from './domain/parse-workbook.js';

type ImportFailure = Extract<ImportResult, { ok: false }>;

const CODE_BY_REASON: Record<ImportFailure['reason'], ErrorCode> = {
  invalidStructure: ErrorCode.IMPORT_INVALID_STRUCTURE,
  invalidData: ErrorCode.IMPORT_INVALID_DATA,
  tooManyRows: ErrorCode.IMPORT_TOO_MANY_ROWS,
};

/** `Candidatures!B7`, the spreadsheet way to name a cell; the sheet alone when it is missing. */
function fieldName({ sheet, cell }: CellError): string {
  return cell === undefined ? sheet : `${sheet}!${cell}`;
}

/** The problem returned for a rejected workbook: one field per invalid cell. */
export function importFailure({ reason, errors }: ImportFailure): AppException {
  return new AppException(
    CODE_BY_REASON[reason],
    undefined,
    errors.length === 0
      ? undefined
      : errors.map((error) => ({ field: fieldName(error), constraints: [error.constraint] })),
  );
}
