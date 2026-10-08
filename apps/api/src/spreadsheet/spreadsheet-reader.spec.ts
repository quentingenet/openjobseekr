import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { readSpreadsheet } from './spreadsheet-reader.js';

function workbookFile(bookType: 'xlsx' | 'ods', date1904 = false): Buffer {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([
      ['DATE', 'COMPANY', 'SALARY'],
      [46296, 'Acme', 45000],
      [],
      [null, 'Globex', true],
    ]),
    'Candidatures',
  );
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([[], [], ['COMPÉTENCE']]),
    'Compétences',
  );
  if (date1904) book.Workbook = { WBProps: { date1904: true } };
  return XLSX.write(book, { bookType, type: 'buffer' }) as Buffer;
}

describe('readSpreadsheet', () => {
  it.each(['xlsx', 'ods'] as const)('reads every sheet of an .%s file from cell A1', (type) => {
    const workbook = readSpreadsheet(workbookFile(type), `suivi.${type}`);

    expect(workbook).toEqual({
      date1904: false,
      sheets: [
        {
          name: 'Candidatures',
          rows: [['DATE', 'COMPANY', 'SALARY'], [46296, 'Acme', 45000], [], [null, 'Globex', true]],
        },
        { name: 'Compétences', rows: [[], [], ['COMPÉTENCE']] },
      ],
    });
  });

  it('reads a formula error as such, not as text', () => {
    const book = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([['COMPANY'], ['Acme']]);
    sheet.A2 = { t: 'e', v: 0x17, w: '#REF!' };
    XLSX.utils.book_append_sheet(book, sheet, 'Candidatures');
    const file = XLSX.write(book, { bookType: 'xlsx', type: 'buffer' }) as Buffer;

    expect(readSpreadsheet(file, 'suivi.xlsx')?.sheets[0]?.rows).toEqual([
      ['COMPANY'],
      [{ formulaError: '#REF!' }],
    ]);
  });

  it('reports the 1904 date system', () => {
    expect(readSpreadsheet(workbookFile('xlsx', true), 'old.xlsx')?.date1904).toBe(true);
  });

  it('rejects a file whose content does not match its extension', () => {
    expect(readSpreadsheet(workbookFile('ods'), 'suivi.xlsx')).toBeNull();
    expect(readSpreadsheet(workbookFile('xlsx'), 'suivi.ods')).toBeNull();
  });

  it('rejects CSV, legacy Excel and other files, even renamed', () => {
    const csv = Buffer.from('DATE,COMPANY\n2026-10-01,Acme\n');
    const legacyExcel = XLSX.write(XLSX.utils.book_new(XLSX.utils.aoa_to_sheet([['a']])), {
      bookType: 'biff8',
      type: 'buffer',
    }) as Buffer;

    expect(readSpreadsheet(csv, 'suivi.csv')).toBeNull();
    expect(readSpreadsheet(csv, 'suivi.xlsx')).toBeNull();
    expect(readSpreadsheet(legacyExcel, 'suivi.xlsx')).toBeNull();
    expect(readSpreadsheet(Buffer.from('PK\u0003\u0004 truncated'), 'suivi.xlsx')).toBeNull();
    expect(readSpreadsheet(Buffer.alloc(0), 'suivi.ods')).toBeNull();
  });

  it('rejects an archive that would expand beyond the limit', () => {
    const file = workbookFile('xlsx');

    expect(readSpreadsheet(file, 'suivi.xlsx', { maxUncompressedBytes: 1_000 })).toBeNull();
  });
});
