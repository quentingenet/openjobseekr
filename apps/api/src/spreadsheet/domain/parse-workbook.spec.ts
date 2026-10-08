import { describe, expect, it } from 'vitest';
import { APPLICATION_HEADERS, SKILL_HEADERS, SKILLS_SHEET_NAME } from './spreadsheet-format.js';
import { type CellValue, type ImportWorkbook, parseWorkbook } from './parse-workbook.js';

/** One application row in spreadsheet column order (A to R). */
function applicationRow(values: Partial<Record<string, CellValue>> = {}): CellValue[] {
  const defaults: Record<string, CellValue> = {
    'DATE ENVOI CANDIDATURE': 46296,
    ENTREPRISE: 'Acme',
    'INTITULÉ OFFRE': 'Developer',
  };
  return APPLICATION_HEADERS.map((header) =>
    header in values ? (values[header] ?? null) : (defaults[header] ?? null),
  );
}

function skillsSheet(rows: CellValue[][] = []) {
  return {
    name: SKILLS_SHEET_NAME,
    rows: [['Annonces analysées', 9], [], [...SKILL_HEADERS], ...rows],
  };
}

function workbook(
  applications: CellValue[][] = [applicationRow()],
  skills: CellValue[][] = [],
): ImportWorkbook {
  return {
    date1904: false,
    sheets: [
      { name: 'Candidatures', rows: [[...APPLICATION_HEADERS], ...applications] },
      skillsSheet(skills),
      { name: 'Listes', rows: [['LÉGENDE']] },
    ],
  };
}

/** The follow-up delay of the spreadsheet and of the app: 7 days. */
const parse = (book: ImportWorkbook, limits?: { maxApplications: number; maxSkills: number }) =>
  parseWorkbook(book, { followUpDelayDays: 7, ...(limits && { limits }) });

describe('parseWorkbook', () => {
  describe('applications', () => {
    it('maps every column of the spreadsheet', () => {
      const result = parse(
        workbook([
          applicationRow({
            'DATE ENVOI CANDIDATURE': 46296,
            ENTREPRISE: '  Acme  ',
            'INTITULÉ OFFRE': 'Full-stack developer',
            LOCALISATION: 'Lyon',
            RÉPONSE: 'https://example.com/answer',
            RESSOURCES: 'Glassdoor',
            CANAL: 'Welcome to the Jungle',
            STATUT: 'Entretien RH',
            'CONTACT (NOM / EMAIL)': 'Jane Doe',
            'DATE DE RELANCE': 46303,
            'REMOTE / HYBRIDE': 'Hybride',
            'RYTHME TÉLÉTRAVAIL': '2 days',
            'FOURCHETTE SALAIRE': 45000,
            'VERSION CV / LETTRE': 'v3',
            'STACK / MOTS-CLÉS': 'TypeScript, React',
            'PROCESS DE RECRUTEMENT': '3 rounds',
            NOTES: 'Call back',
            "TEXTE DE L'ANNONCE": 'We use TypeScript',
          }),
        ]),
      );

      expect(result).toEqual({
        ok: true,
        applications: [
          {
            sentAt: '2026-10-01',
            company: 'Acme',
            jobTitle: 'Full-stack developer',
            location: 'Lyon',
            response: 'https://example.com/answer',
            resources: 'Glassdoor',
            channel: 'WELCOME_TO_THE_JUNGLE',
            channelDetail: null,
            status: 'HR_INTERVIEW',
            contact: 'Jane Doe',
            followUpOverride: null,
            workMode: 'HYBRID',
            remoteRhythm: '2 days',
            salaryRange: '45000',
            cvVersion: 'v3',
            stack: 'TypeScript, React',
            recruitmentProcess: '3 rounds',
            notes: 'Call back',
            jobPostingText: 'We use TypeScript',
          },
        ],
        skills: [],
      });
    });

    it('keeps the follow-up date of the sheet only when it differs from the computed one', () => {
      const result = parse(
        workbook([
          applicationRow({ 'DATE DE RELANCE': 46303 }),
          applicationRow({ 'DATE DE RELANCE': '20/10/2026' }),
          applicationRow({ 'DATE DE RELANCE': '' }),
          applicationRow({ STATUT: 'Refus', 'DATE DE RELANCE': 46310 }),
        ]),
      );

      expect(result.ok && result.applications.map((row) => row.followUpOverride)).toEqual([
        null,
        '2026-10-20',
        null,
        '2026-10-15',
      ]);
    });

    it('rejects a follow-up date that is not a date', () => {
      expect(parse(workbook([applicationRow({ 'DATE DE RELANCE': 'soon' })]))).toEqual({
        ok: false,
        reason: 'invalidData',
        errors: [{ sheet: 'Candidatures', cell: 'J2', constraint: 'isCalendarDate' }],
      });
    });

    it('defaults to SENT and leaves the optional columns empty', () => {
      const result = parse(workbook([applicationRow({ LOCALISATION: '   ' })]));

      expect(result).toMatchObject({
        ok: true,
        applications: [
          {
            sentAt: '2026-10-01',
            company: 'Acme',
            jobTitle: 'Developer',
            location: null,
            channel: null,
            status: 'SENT',
            workMode: null,
            jobPostingText: null,
          },
        ],
      });
    });

    it('translates every label of the spreadsheet lists, ignoring case', () => {
      const statuses = [
        ['Envoyée', 'SENT'],
        ['Réponse reçue', 'RESPONSE_RECEIVED'],
        ['entretien rh', 'HR_INTERVIEW'],
        ['Entretien technique', 'TECHNICAL_INTERVIEW'],
        ['Offre', 'OFFER'],
        ['Refus', 'REJECTED'],
        ['Sans réponse', 'NO_RESPONSE'],
      ];
      const channels = [
        ['Site carrière', 'CAREER_SITE'],
        ['LinkedIn', 'LINKEDIN'],
        ['Welcome to the Jungle', 'WELCOME_TO_THE_JUNGLE'],
        ['Hellowork', 'HELLOWORK'],
        ['APEC', 'APEC'],
        ['Indeed', 'INDEED'],
        ['Free-Work', 'FREE_WORK'],
        ['Licorne Society', 'LICORNE_SOCIETY'],
        ['Cabinet de recrutement', 'RECRUITMENT_AGENCY'],
        ['Candidature spontanée', 'UNSOLICITED'],
        ['Cooptation', 'REFERRAL'],
        ['Autre', 'OTHER'],
      ];
      const workModes = [
        ['Présentiel', 'ONSITE'],
        ['Hybride', 'HYBRID'],
        ['Full remote', 'FULL_REMOTE'],
        ['Non précisé', 'UNSPECIFIED'],
      ];
      const rows = [...statuses, ...channels, ...workModes].map((_, index) =>
        applicationRow({
          STATUT: statuses[index % statuses.length]?.[0] ?? null,
          CANAL: channels[index % channels.length]?.[0] ?? null,
          'REMOTE / HYBRIDE': workModes[index % workModes.length]?.[0] ?? null,
        }),
      );

      const result = parse(workbook(rows));

      if (!result.ok) throw new Error('expected a valid workbook');
      expect(result.applications.slice(0, 7).map((row) => row.status)).toEqual(
        statuses.map(([, code]) => code),
      );
      expect(result.applications.slice(0, 12).map((row) => row.channel)).toEqual(
        channels.map(([, code]) => code),
      );
      expect(result.applications.slice(0, 4).map((row) => row.workMode)).toEqual(
        workModes.map(([, code]) => code),
      );
    });

    it('reads the precision of the "Autre" channel written as "Autre (Monster)"', () => {
      const result = parse(
        workbook([
          applicationRow({ CANAL: 'Autre (Monster)' }),
          applicationRow({ CANAL: ' autre  ( Jobteaser ) ' }),
          applicationRow({ CANAL: 'Autre' }),
        ]),
      );

      expect(
        result.ok && result.applications.map((row) => [row.channel, row.channelDetail]),
      ).toEqual([
        ['OTHER', 'Monster'],
        ['OTHER', 'Jobteaser'],
        ['OTHER', null],
      ]);
    });

    it('accepts a precision only for the "Autre" channel, within its length limit', () => {
      expect(
        parse(
          workbook([
            applicationRow({ CANAL: 'Apec (Paris)' }),
            applicationRow({ CANAL: `Autre (${'x'.repeat(201)})` }),
          ]),
        ),
      ).toEqual({
        ok: false,
        reason: 'invalidData',
        errors: [
          { sheet: 'Candidatures', cell: 'G2', constraint: 'isIn' },
          { sheet: 'Candidatures', cell: 'G3', constraint: 'maxLength' },
        ],
      });
    });

    it('skips empty rows, including rows holding only the computed follow-up date', () => {
      const result = parse(
        workbook([
          applicationRow(),
          APPLICATION_HEADERS.map(() => null),
          APPLICATION_HEADERS.map((header) => (header === 'DATE DE RELANCE' ? '' : null)),
          [],
          applicationRow({ ENTREPRISE: 'Globex' }),
        ]),
      );

      expect(result.ok && result.applications.map((row) => row.company)).toEqual([
        'Acme',
        'Globex',
      ]);
    });

    it('reports every invalid cell with its reference, and imports nothing', () => {
      const result = parse(
        workbook([
          applicationRow(),
          applicationRow({
            'DATE ENVOI CANDIDATURE': 'tomorrow',
            ENTREPRISE: ' ',
            STATUT: 'Pending',
            CANAL: 'Monster',
            'REMOTE / HYBRIDE': 'Remote',
          }),
          applicationRow({ 'DATE ENVOI CANDIDATURE': null, 'INTITULÉ OFFRE': 'x'.repeat(201) }),
        ]),
      );

      expect(result).toEqual({
        ok: false,
        reason: 'invalidData',
        errors: [
          { sheet: 'Candidatures', cell: 'A3', constraint: 'isCalendarDate' },
          { sheet: 'Candidatures', cell: 'B3', constraint: 'isNotEmpty' },
          { sheet: 'Candidatures', cell: 'G3', constraint: 'isIn' },
          { sheet: 'Candidatures', cell: 'H3', constraint: 'isIn' },
          { sheet: 'Candidatures', cell: 'K3', constraint: 'isIn' },
          { sheet: 'Candidatures', cell: 'A4', constraint: 'isNotEmpty' },
          { sheet: 'Candidatures', cell: 'C4', constraint: 'maxLength' },
        ],
      });
    });

    it('rejects formula errors, even in free text columns', () => {
      const result = parse(
        workbook(
          [
            applicationRow({
              ENTREPRISE: { formulaError: '#REF!' },
              'DATE DE RELANCE': { formulaError: '#VALUE!' },
            }),
          ],
          [[{ formulaError: '#N/A' }, 'Go', null, null, { formulaError: '#DIV/0!' }]],
        ),
      );

      expect(result).toEqual({
        ok: false,
        reason: 'invalidData',
        errors: [
          { sheet: 'Candidatures', cell: 'B2', constraint: 'formulaError' },
          { sheet: 'Candidatures', cell: 'J2', constraint: 'formulaError' },
          { sheet: 'Compétences', cell: 'A4', constraint: 'formulaError' },
          { sheet: 'Compétences', cell: 'E4', constraint: 'formulaError' },
        ],
      });
    });

    it('reports at most 50 invalid cells', () => {
      const rows = Array.from({ length: 60 }, () => applicationRow({ ENTREPRISE: ' ' }));

      const result = parse(workbook(rows));

      expect(!result.ok && result.errors).toHaveLength(50);
    });

    it('rejects more rows than the limit before validating them', () => {
      const result = parse(workbook([applicationRow(), applicationRow()]), {
        maxApplications: 1,
        maxSkills: 10,
      });

      expect(result).toEqual({ ok: false, reason: 'tooManyRows', errors: [] });
    });
  });

  describe('structure', () => {
    it('reads the applications from the first sheet, whatever its name', () => {
      const book = workbook();
      const [applications, ...others] = book.sheets;
      if (!applications) throw new Error('missing sheet');

      const result = parse({
        ...book,
        sheets: [{ ...applications, name: 'Feuille1' }, ...others],
      });

      expect(result.ok && result.applications).toHaveLength(1);
    });

    it('accepts column titles differing only by case, spaces or apostrophe style', () => {
      const headers = APPLICATION_HEADERS.map((header) =>
        ` ${header.toLowerCase()} `.replace("'", '’'),
      );

      const result = parse({
        ...workbook(),
        sheets: [{ name: 'Candidatures', rows: [headers, applicationRow()] }, skillsSheet()],
      });

      expect(result.ok).toBe(true);
    });

    it('rejects a renamed, missing or extra column', () => {
      const headers: CellValue[] = [...APPLICATION_HEADERS];
      headers[1] = 'SOCIÉTÉ';
      const withoutLast = headers.slice(0, -1);

      expect(
        parse({
          ...workbook(),
          sheets: [{ name: 'Candidatures', rows: [withoutLast] }, skillsSheet()],
        }),
      ).toEqual({
        ok: false,
        reason: 'invalidStructure',
        errors: [
          { sheet: 'Candidatures', cell: 'B1', constraint: 'expectedHeader' },
          { sheet: 'Candidatures', cell: 'R1', constraint: 'expectedHeader' },
        ],
      });
      expect(
        parse({
          ...workbook(),
          sheets: [
            { name: 'Candidatures', rows: [[...APPLICATION_HEADERS, 'PRIORITY']] },
            skillsSheet(),
          ],
        }),
      ).toEqual({
        ok: false,
        reason: 'invalidStructure',
        errors: [{ sheet: 'Candidatures', cell: 'S1', constraint: 'unexpectedColumn' }],
      });
    });

    it('requires the skills sheet and its column titles on row 3', () => {
      const book = workbook();

      expect(parse({ ...book, sheets: book.sheets.slice(0, 1) })).toEqual({
        ok: false,
        reason: 'invalidStructure',
        errors: [{ sheet: 'Compétences', constraint: 'missingSheet' }],
      });
      expect(
        parse({
          ...book,
          sheets: [...book.sheets.slice(0, 1), { name: 'Compétences', rows: [[...SKILL_HEADERS]] }],
        }),
      ).toEqual({
        ok: false,
        reason: 'invalidStructure',
        errors: SKILL_HEADERS.map((_, index) => ({
          sheet: 'Compétences',
          cell: `${'ABCDEFG'[index]}3`,
          constraint: 'expectedHeader',
        })),
      });
    });

    it('rejects a workbook without sheets', () => {
      expect(parse({ date1904: false, sheets: [] })).toEqual({
        ok: false,
        reason: 'invalidStructure',
        errors: [
          { sheet: 'Candidatures', constraint: 'missingSheet' },
          { sheet: 'Compétences', constraint: 'missingSheet' },
        ],
      });
    });
  });

  describe('skills', () => {
    it('reads name, pattern and level, and ignores the computed columns', () => {
      const result = parse(
        workbook(
          [],
          [
            ['React', '\\bReact(\\.?js)?\\b', 6, 0.66, 3, 1.3, 2],
            [' TypeScript ', '\\bTypeScript\\b', 9, 1, '4', '', ''],
            ['Java', '\\bJava\\b', 0, 0, null, '', ''],
            [null, null, '', '', null, '', ''],
          ],
        ),
      );

      expect(result).toEqual({
        ok: true,
        applications: [],
        skills: [
          { row: 4, name: 'React', pattern: '\\bReact(\\.?js)?\\b', level: 3 },
          { row: 5, name: 'TypeScript', pattern: '\\bTypeScript\\b', level: 4 },
          { row: 6, name: 'Java', pattern: '\\bJava\\b', level: null },
        ],
      });
    });

    it('reports invalid skills by cell', () => {
      const result = parse(
        workbook(
          [],
          [
            ['Lookahead', '(?=x)'],
            [null, '\\bGo\\b'],
            ['Rust', null, null, null, 6],
            ['x'.repeat(101), 'x', null, null, 2.5],
          ],
        ),
      );

      expect(result).toEqual({
        ok: false,
        reason: 'invalidData',
        errors: [
          { sheet: 'Compétences', cell: 'B4', constraint: 'isRegex' },
          { sheet: 'Compétences', cell: 'A5', constraint: 'isNotEmpty' },
          { sheet: 'Compétences', cell: 'B6', constraint: 'isNotEmpty' },
          { sheet: 'Compétences', cell: 'E6', constraint: 'isSkillLevel' },
          { sheet: 'Compétences', cell: 'A7', constraint: 'maxLength' },
          { sheet: 'Compétences', cell: 'E7', constraint: 'isSkillLevel' },
        ],
      });
    });

    it('rejects more skills than the limit', () => {
      const result = parse(
        workbook(
          [],
          [
            ['Go', 'Go'],
            ['Rust', 'Rust'],
          ],
        ),
        { maxApplications: 10, maxSkills: 1 },
      );

      expect(result).toEqual({ ok: false, reason: 'tooManyRows', errors: [] });
    });
  });
});
