import { describe, expect, it } from 'vitest';
import {
  buildWorkbook,
  type ExportApplication,
  type ExportSheet,
  type ExportSkill,
} from './build-workbook.js';
import { APPLICATION_HEADERS, SKILL_HEADERS } from './spreadsheet-format.js';

const application = (values: Partial<ExportApplication> = {}): ExportApplication => ({
  sentAt: '2026-10-01',
  company: 'Acme',
  jobTitle: 'Developer',
  location: null,
  response: null,
  resources: null,
  channel: null,
  channelDetail: null,
  status: 'SENT',
  contact: null,
  followUpOverride: null,
  workMode: null,
  remoteRhythm: null,
  salaryRange: null,
  cvVersion: null,
  stack: null,
  recruitmentProcess: null,
  notes: null,
  jobPostingText: null,
  ...values,
});

const skill = (values: Partial<ExportSkill> = {}): ExportSkill => ({
  name: 'React',
  pattern: '\\bReact\\b',
  level: null,
  postingCount: 0,
  frequency: 0,
  ...values,
});

function build(applications: ExportApplication[], skills: ExportSkill[] = []) {
  return buildWorkbook({
    applications,
    skills,
    postingsAnalyzed: applications.filter((row) => row.jobPostingText).length,
    followUpDelayDays: 7,
  });
}

const sheet = (sheets: ExportSheet[], name: string) => {
  const found = sheets.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`missing sheet ${name}`);
  return found;
};

const FOLLOW_UP_FORMULA = 'IF(AND(A2<>"",H2="Envoyée"),A2+Listes!$B$3,"")';

describe('buildWorkbook', () => {
  it('writes the three sheets of the spreadsheet, in order', () => {
    expect(build([]).map((candidate) => candidate.name)).toEqual([
      'Candidatures',
      'Compétences',
      'Listes',
    ]);
  });

  it('writes one application per row, in the spreadsheet column order and labels', () => {
    const rows = sheet(
      build([
        application({
          company: 'Globex',
          location: 'Lyon',
          channel: 'OTHER',
          channelDetail: 'Monster',
          status: 'HR_INTERVIEW',
          workMode: 'HYBRID',
          salaryRange: '45-50k',
          jobPostingText: 'We use React',
        }),
      ]),
      'Candidatures',
    ).rows;

    expect(rows[0]).toEqual(APPLICATION_HEADERS);
    expect(rows[1]).toEqual([
      { date: '2026-10-01' },
      'Globex',
      'Developer',
      'Lyon',
      null,
      null,
      'Autre (Monster)',
      'Entretien RH',
      null,
      { formula: FOLLOW_UP_FORMULA, value: null, isDate: true },
      'Hybride',
      null,
      '45-50k',
      null,
      null,
      null,
      null,
      'We use React',
    ]);
  });

  it('writes the follow-up formula with its computed date, or the date picked by hand', () => {
    const rows = sheet(
      build([application(), application({ followUpOverride: '2026-10-20' })]),
      'Candidatures',
    ).rows;

    expect(rows[1]?.[9]).toEqual({ formula: FOLLOW_UP_FORMULA, value: '2026-10-08', isDate: true });
    expect(rows[2]?.[9]).toEqual({ date: '2026-10-20' });
  });

  it('writes the skills from row 4, with their computed columns', () => {
    const rows = sheet(
      build(
        [application({ jobPostingText: 'React' }), application({ jobPostingText: 'Go' })],
        [
          skill({ name: 'React', level: 3, postingCount: 1, frequency: 0.5 }),
          skill({ name: 'Go', pattern: '\\bGo\\b', level: 1, postingCount: 1, frequency: 0.5 }),
          skill({ name: 'Rust', pattern: 'Rust' }),
        ],
      ),
      'Compétences',
    ).rows;

    expect(rows[0]?.slice(0, 2)).toEqual([
      'Annonces analysées',
      { formula: 'COUNTA(Candidatures!R2:R3)', value: 2 },
    ]);
    expect(rows[2]).toEqual(SKILL_HEADERS);
    expect(rows.slice(3)).toEqual([
      [
        'React',
        '\\bReact\\b',
        1,
        0.5,
        3,
        { formula: 'IF(OR(D4="",E4=""),"",D4*(5-E4))', value: 1 },
        { formula: 'IF(F4="","",RANK(F4,$F$4:$F$6))', value: 2 },
      ],
      [
        'Go',
        '\\bGo\\b',
        1,
        0.5,
        1,
        { formula: 'IF(OR(D5="",E5=""),"",D5*(5-E5))', value: 2 },
        { formula: 'IF(F5="","",RANK(F5,$F$4:$F$6))', value: 1 },
      ],
      [
        'Rust',
        'Rust',
        0,
        0,
        null,
        { formula: 'IF(OR(D6="",E6=""),"",D6*(5-E6))', value: '' },
        { formula: 'IF(F6="","",RANK(F6,$F$4:$F$6))', value: '' },
      ],
    ]);
  });

  it('leaves the priority score empty while no job posting is saved', () => {
    const rows = sheet(build([], [skill({ level: 2, frequency: null })]), 'Compétences').rows;

    expect(rows[3]?.[3]).toBeNull();
    expect(rows[3]?.[5]).toMatchObject({ value: '' });
  });

  it('writes the follow-up delay and the drop-down labels in the "Listes" sheet', () => {
    const rows = sheet(build([]), 'Listes').rows;

    expect(rows[2]).toEqual(['Délai de relance (jours)', 7]);
    expect(rows[4]).toEqual(['Statuts', 'Canaux', 'Mode de travail']);
    expect(rows[5]).toEqual(['Envoyée', 'Site carrière', 'Présentiel']);
    expect(rows.slice(5).map((row) => row[1])).toHaveLength(12);
  });
});
