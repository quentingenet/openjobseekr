import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CHANNEL_LABELS, STATUS_LABELS, WORK_MODE_LABELS } from './domain/import-format.js';
import { parseWorkbook } from './domain/parse-workbook.js';
import { readSpreadsheet } from './spreadsheet-reader.js';

/** The empty templates offered for download by the web app. */
const templates = ['xlsx', 'ods'].map((format) => {
  const name = `suivi_candidatures_modele.${format}`;
  const url = new URL(`../../../web/public/templates/${name}`, import.meta.url);
  return { name, file: readFileSync(url) };
});

describe.each(templates)('template $name', ({ name, file }) => {
  const workbook = readSpreadsheet(file, name);

  it('is accepted by the import, with no application and no skill', () => {
    expect(workbook && parseWorkbook(workbook, { followUpDelayDays: 7 })).toEqual({
      ok: true,
      applications: [],
      skills: [],
    });
  });

  it('offers exactly the labels the import understands in its lists', () => {
    const lists = workbook?.sheets.find((sheet) => sheet.name === 'Listes');
    const column = (index: number) =>
      (lists?.rows ?? []).slice(5).flatMap((row) => (row[index] ? [row[index]] : []));

    expect(column(0)).toEqual(Object.values(STATUS_LABELS));
    expect(column(1)).toEqual(Object.values(CHANNEL_LABELS));
    expect(column(2)).toEqual(Object.values(WORK_MODE_LABELS));
  });
});
