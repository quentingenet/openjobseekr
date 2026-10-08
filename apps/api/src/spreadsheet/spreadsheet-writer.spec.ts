import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { buildWorkbook, type ExportApplication } from './domain/build-workbook.js';
import { parseWorkbook } from './domain/parse-workbook.js';
import { readSpreadsheet } from './spreadsheet-reader.js';
import { toOdsSheetReferences, writeSpreadsheet } from './spreadsheet-writer.js';

const base: ExportApplication = {
  sentAt: '2026-10-01',
  company: 'Acme',
  jobTitle: 'Developer',
  location: 'Lyon',
  response: 'https://example.com',
  resources: null,
  channel: 'OTHER',
  channelDetail: 'Monster',
  status: 'SENT',
  contact: 'Jane Doe',
  followUpOverride: null,
  workMode: 'HYBRID',
  remoteRhythm: '2 days',
  salaryRange: '45000',
  cvVersion: 'v3',
  stack: 'TypeScript',
  recruitmentProcess: '3 rounds',
  notes: '=1+1 stays text',
  jobPostingText: 'We use TypeScript and React',
};

const applications: ExportApplication[] = [
  base,
  { ...base, company: 'Globex', status: 'REJECTED', channel: 'APEC', channelDetail: null },
  { ...base, company: 'Initech', followUpOverride: '2026-10-20', workMode: null },
];

const skills = [
  { name: 'TypeScript', pattern: '\\bTypeScript\\b', level: 3, postingCount: 3, frequency: 1 },
  { name: 'Go', pattern: '\\bGo\\b', level: null, postingCount: 0, frequency: 0 },
];

describe.each(['xlsx', 'ods'] as const)('writeSpreadsheet (.%s)', (format) => {
  const file = writeSpreadsheet(
    buildWorkbook({ applications, skills, postingsAnalyzed: 3, followUpDelayDays: 7 }),
    format,
  );

  it('gives back the same applications and skills once imported', () => {
    const workbook = readSpreadsheet(file, `suivi.${format}`);

    expect(workbook && parseWorkbook(workbook, { followUpDelayDays: 7 })).toEqual({
      ok: true,
      applications,
      skills: [
        { row: 4, name: 'TypeScript', pattern: '\\bTypeScript\\b', level: 3 },
        { row: 5, name: 'Go', pattern: '\\bGo\\b', level: null },
      ],
    });
  });

  it('keeps the follow-up formula and the computed values', () => {
    const rows = readSpreadsheet(file, `suivi.${format}`)?.sheets[0]?.rows;

    // 2026-10-08 (sent date + 7 days), empty for a rejected one, the date picked by hand.
    expect(rows?.slice(1).map((row) => row[9] ?? null)).toEqual([46303, '', 46315]);
    const sheet = XLSX.read(file, { type: 'buffer', cellFormula: true }).Sheets.Candidatures;
    const cell = (address: string) => sheet?.[address] as XLSX.CellObject | undefined;
    expect(cell('J2')?.f).toMatch(/^(of:=)?IF\(AND\(\[?\.?A2\]?<>"",\[?\.?H2\]?="Envoyée"\)/);
    expect(cell('J4')?.f).toBeUndefined();
  });
});

describe('toOdsSheetReferences', () => {
  it('writes references to another sheet the OpenDocument way', () => {
    expect(toOdsSheetReferences('A2+Listes!$B$3')).toBe('A2+[$Listes.B3]');
    expect(toOdsSheetReferences('COUNTA(Candidatures!R2:R40)')).toBe(
      'COUNTA([$Candidatures.R2:.R40])',
    );
  });

  it('leaves references to the same sheet and text alone', () => {
    expect(toOdsSheetReferences('IF(H2="Envoyée",A2,"")')).toBe('IF(H2="Envoyée",A2,"")');
  });
});
