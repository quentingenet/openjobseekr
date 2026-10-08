import {
  addDays,
  type ApplicationChannel,
  type ApplicationStatus,
  type ApplicationTextField,
  FOLLOW_UP_STATUS,
  SKILL_LEVEL,
  type WorkMode,
} from '@openjobseekr/domain';
import {
  APPLICATION_COLUMNS,
  APPLICATION_HEADERS,
  APPLICATIONS_SHEET_NAME,
  CHANNEL_LABELS,
  columnLetter,
  FOLLOW_UP_DELAY_ROW,
  formatChannelCell,
  LISTS_SHEET_NAME,
  SKILL_COLUMN,
  SKILL_COMPUTED_COLUMN,
  SKILL_HEADERS,
  SKILLS_HEADER_ROW,
  SKILLS_SHEET_NAME,
  STATUS_LABELS,
  WORK_MODE_LABELS,
} from './spreadsheet-format.js';

/**
 * A cell to write: text, number, a calendar date, or a formula with the value it computes
 * (spreadsheets show the stored value until they recalculate, and the import reads it).
 */
export type ExportCell =
  | string
  | number
  | null
  | { date: string }
  | { formula: string; value: string | number | null; isDate?: boolean };

export interface ExportSheet {
  name: string;
  rows: ExportCell[][];
  /** Column widths, in characters. */
  columnWidths: number[];
}

export type ExportApplication = Record<ApplicationTextField, string | null> & {
  sentAt: string;
  channel: ApplicationChannel | null;
  status: ApplicationStatus;
  followUpOverride: string | null;
  workMode: WorkMode | null;
};

export interface ExportSkill {
  name: string;
  pattern: string;
  level: number | null;
  postingCount: number;
  /** Null when no job posting text is saved. */
  frequency: number | null;
}

export interface WorkbookData {
  /** In the sheet order: oldest first. */
  applications: ExportApplication[];
  skills: ExportSkill[];
  postingsAnalyzed: number;
  followUpDelayDays: number;
}

const columnOf = (kind: (typeof APPLICATION_COLUMNS)[number]['kind'], field?: string): string =>
  columnLetter(
    APPLICATION_COLUMNS.findIndex(
      (column) => column.kind === kind && (!field || ('field' in column && column.field === field)),
    ),
  );

const SENT_AT = columnOf('date');
const STATUS = columnOf('status');
const POSTING_TEXT = columnOf('text', 'jobPostingText');
const DELAY = `${LISTS_SHEET_NAME}!$B$${FOLLOW_UP_DELAY_ROW}`;

/**
 * The sheet's follow-up formula ("DATE DE RELANCE"): sent date + delay while the status is
 * `Envoyée`. A date picked by hand is written as a plain date instead, so that the import
 * finds it again.
 */
function followUpCell(application: ExportApplication, row: number, delayDays: number): ExportCell {
  if (application.followUpOverride) return { date: application.followUpOverride };
  const waiting = application.status === FOLLOW_UP_STATUS;
  return {
    formula: `IF(AND(${SENT_AT}${row}<>"",${STATUS}${row}="${STATUS_LABELS[FOLLOW_UP_STATUS]}"),${SENT_AT}${row}+${DELAY},"")`,
    value: waiting ? addDays(application.sentAt, delayDays) : null,
    isDate: true,
  };
}

function applicationRow(
  application: ExportApplication,
  row: number,
  delayDays: number,
): ExportCell[] {
  return APPLICATION_COLUMNS.map((column) => {
    switch (column.kind) {
      case 'date':
        return { date: application.sentAt };
      case 'text':
        return application[column.field];
      case 'channel':
        return formatChannelCell(application.channel, application.channelDetail);
      case 'status':
        return STATUS_LABELS[application.status];
      case 'workMode':
        return application.workMode && WORK_MODE_LABELS[application.workMode];
      case 'followUp':
        return followUpCell(application, row, delayDays);
    }
  });
}

/** Priority score of the sheet: frequent skills you know little come first. */
function priorityScore(skill: ExportSkill): number | '' {
  return skill.level === null || skill.frequency === null
    ? ''
    : skill.frequency * (SKILL_LEVEL.max - skill.level);
}

function skillsRows({ skills, postingsAnalyzed, applications }: WorkbookData): ExportCell[][] {
  const first = SKILLS_HEADER_ROW + 1;
  const last = Math.max(first, SKILLS_HEADER_ROW + skills.length);
  const lastApplicationRow = Math.max(2, applications.length + 1);
  const scores = skills.map(priorityScore);
  const frequency = columnLetter(SKILL_COMPUTED_COLUMN.frequency);
  const level = columnLetter(SKILL_COLUMN.level);
  const score = columnLetter(SKILL_COMPUTED_COLUMN.score);
  return [
    [
      'Annonces analysées',
      {
        formula: `COUNTA(${APPLICATIONS_SHEET_NAME}!${POSTING_TEXT}2:${POSTING_TEXT}${lastApplicationRow})`,
        value: postingsAnalyzed,
      },
      null,
      "Seules les lignes dont la colonne « TEXTE DE L'ANNONCE » est remplie sont comptées.",
    ],
    [],
    [...SKILL_HEADERS],
    ...skills.map((skill, index): ExportCell[] => {
      const row = first + index;
      const own = scores[index] ?? '';
      // RANK: 1 for the highest score; equal scores share a rank.
      const position =
        own === '' ? '' : 1 + scores.filter((other) => other !== '' && other > own).length;
      return [
        skill.name,
        skill.pattern,
        skill.postingCount,
        skill.frequency,
        skill.level,
        {
          formula: `IF(OR(${frequency}${row}="",${level}${row}=""),"",${frequency}${row}*(${SKILL_LEVEL.max}-${level}${row}))`,
          value: own,
        },
        {
          formula: `IF(${score}${row}="","",RANK(${score}${row},$${score}$${first}:$${score}$${last}))`,
          value: position,
        },
      ];
    }),
  ];
}

/** The "Listes" sheet of the template: follow-up delay, then the drop-down labels. */
function listsRows(delayDays: number): ExportCell[][] {
  const columns = [STATUS_LABELS, CHANNEL_LABELS, WORK_MODE_LABELS].map((labels) =>
    Object.values<string>(labels),
  );
  const length = Math.max(...columns.map((labels) => labels.length));
  return [
    ['LÉGENDE'],
    [],
    ['Délai de relance (jours)', delayDays],
    [],
    ['Statuts', 'Canaux', 'Mode de travail'],
    ...Array.from({ length }, (_, index) => columns.map((labels) => labels[index] ?? null)),
  ];
}

/**
 * The workbook in the layout of the job search spreadsheet, the one the import reads: export
 * then import gives back the same applications and skills.
 */
export function buildWorkbook(data: WorkbookData): ExportSheet[] {
  return [
    {
      name: APPLICATIONS_SHEET_NAME,
      rows: [
        [...APPLICATION_HEADERS],
        ...data.applications.map((application, index) =>
          applicationRow(application, index + 2, data.followUpDelayDays),
        ),
      ],
      columnWidths: APPLICATION_COLUMNS.map((column) =>
        column.kind === 'text' && column.field === 'jobPostingText' ? 60 : 22,
      ),
    },
    { name: SKILLS_SHEET_NAME, rows: skillsRows(data), columnWidths: [22, 26, 16, 12, 20, 18, 8] },
    { name: LISTS_SHEET_NAME, rows: listsRows(data.followUpDelayDays), columnWidths: [26, 26, 18] },
  ];
}
