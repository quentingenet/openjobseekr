import {
  type ApplicationChannel,
  type ApplicationStatus,
  type ApplicationTextField,
  OTHER_CHANNEL,
  type WorkMode,
} from '@openjobseekr/domain';

/**
 * The layout of the job search spreadsheet (see `apps/web/public/templates/`): column titles
 * and list labels stay in French, as in the original sheet. Do not rename or reorder them.
 */

type ApplicationColumn =
  | { header: string; kind: 'date' }
  | { header: string; kind: 'text'; field: ApplicationTextField; required?: boolean }
  | { header: string; kind: 'status' | 'channel' | 'workMode' }
  /**
   * Computed by the sheet's formula, or typed by hand: only a date differing from the computed
   * one is imported (`followUpOverride`).
   */
  | { header: string; kind: 'followUp' };

/** First sheet, columns A to R from row 1; one application per row from row 2. */
export const APPLICATION_COLUMNS: readonly ApplicationColumn[] = [
  { header: 'DATE ENVOI CANDIDATURE', kind: 'date' },
  { header: 'ENTREPRISE', kind: 'text', field: 'company', required: true },
  { header: 'INTITULÉ OFFRE', kind: 'text', field: 'jobTitle', required: true },
  { header: 'LOCALISATION', kind: 'text', field: 'location' },
  { header: 'RÉPONSE', kind: 'text', field: 'response' },
  { header: 'RESSOURCES', kind: 'text', field: 'resources' },
  { header: 'CANAL', kind: 'channel' },
  { header: 'STATUT', kind: 'status' },
  { header: 'CONTACT (NOM / EMAIL)', kind: 'text', field: 'contact' },
  { header: 'DATE DE RELANCE', kind: 'followUp' },
  { header: 'REMOTE / HYBRIDE', kind: 'workMode' },
  { header: 'RYTHME TÉLÉTRAVAIL', kind: 'text', field: 'remoteRhythm' },
  { header: 'FOURCHETTE SALAIRE', kind: 'text', field: 'salaryRange' },
  { header: 'VERSION CV / LETTRE', kind: 'text', field: 'cvVersion' },
  { header: 'STACK / MOTS-CLÉS', kind: 'text', field: 'stack' },
  { header: 'PROCESS DE RECRUTEMENT', kind: 'text', field: 'recruitmentProcess' },
  { header: 'NOTES', kind: 'text', field: 'notes' },
  { header: "TEXTE DE L'ANNONCE", kind: 'text', field: 'jobPostingText' },
];

export const APPLICATION_HEADERS = APPLICATION_COLUMNS.map((column) => column.header);

/** Name used in error reports when the workbook has no sheet at all. */
export const APPLICATIONS_SHEET_NAME = 'Candidatures';

/** Skills sheet, found by name: titles on row 3, one skill per row from row 4. */
export const SKILLS_SHEET_NAME = 'Compétences';
export const SKILLS_HEADER_ROW = 3;

/** Columns A to G; C, D, F and G are computed by the sheet and ignored. */
export const SKILL_HEADERS = [
  'COMPÉTENCE',
  'TERME RECHERCHÉ',
  "NB D'ANNONCES",
  'FRÉQUENCE',
  'NIVEAU ACTUEL (0-5)',
  'SCORE DE PRIORITÉ',
  'RANG',
] as const;

/** Columns the import reads. */
export const SKILL_COLUMN = { name: 0, pattern: 1, level: 4 } as const;
/** Columns computed by the sheet: written by the export, ignored by the import. */
export const SKILL_COMPUTED_COLUMN = { postingCount: 2, frequency: 3, score: 5, rank: 6 } as const;

/**
 * "Listes" sheet: the follow-up delay read by the follow-up formula, then the labels of the
 * drop-down lists (statuses, channels, work modes in columns A to C) from row 6.
 */
export const LISTS_SHEET_NAME = 'Listes';
/** Row 3: the label in A, the delay in B. */
export const FOLLOW_UP_DELAY_ROW = 3;
export const LISTS_HEADER_ROW = 5;

/** `0` -> `A`, `25` -> `Z`, `26` -> `AA`. */
export function columnLetter(index: number): string {
  let letters = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters;
  }
  return letters;
}

/** Labels of the sheet's drop-down lists (tab "Listes"). */
export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  SENT: 'Envoyée',
  RESPONSE_RECEIVED: 'Réponse reçue',
  HR_INTERVIEW: 'Entretien RH',
  TECHNICAL_INTERVIEW: 'Entretien technique',
  OFFER: 'Offre',
  REJECTED: 'Refus',
  NO_RESPONSE: 'Sans réponse',
};

export const CHANNEL_LABELS: Record<ApplicationChannel, string> = {
  CAREER_SITE: 'Site carrière',
  LINKEDIN: 'LinkedIn',
  WELCOME_TO_THE_JUNGLE: 'Welcome to the Jungle',
  HELLOWORK: 'Hellowork',
  APEC: 'Apec',
  INDEED: 'Indeed',
  FREE_WORK: 'Free-Work',
  LICORNE_SOCIETY: 'Licorne Society',
  RECRUITMENT_AGENCY: 'Cabinet de recrutement',
  UNSOLICITED: 'Candidature spontanée',
  REFERRAL: 'Cooptation',
  OTHER: 'Autre',
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  ONSITE: 'Présentiel',
  HYBRID: 'Hybride',
  FULL_REMOTE: 'Full remote',
  UNSPECIFIED: 'Non précisé',
};

/**
 * Titles and labels are compared ignoring case, accent encoding, surrounding and repeated
 * spaces, and the apostrophe style (’ or ').
 */
export function normalizeLabel(value: string): string {
  return value.normalize('NFC').replaceAll('’', "'").trim().replace(/\s+/g, ' ').toLowerCase();
}

const CHANNEL_BY_LABEL = new Map(
  (Object.entries(CHANNEL_LABELS) as [ApplicationChannel, string][]).map(([code, label]) => [
    normalizeLabel(label),
    code,
  ]),
);

/** "Autre (Monster)": a label followed by a precision in parentheses. */
const WITH_PRECISION = /^(.*?)\s*\((.*)\)$/s;

/**
 * The CANAL cell: the channel label, and for the OTHER channel its precision in parentheses
 * ("Autre (Monster)"), since the sheet has no column for it.
 */
export function formatChannelCell(
  channel: ApplicationChannel | null,
  channelDetail: string | null,
): string | null {
  if (channel === null) return null;
  const label = CHANNEL_LABELS[channel];
  return channel === OTHER_CHANNEL && channelDetail ? `${label} (${channelDetail})` : label;
}

/** Reads a CANAL cell written by `formatChannelCell`; null for an unknown label. */
export function parseChannelCell(
  text: string,
): { channel: ApplicationChannel; channelDetail: string | null } | null {
  const channel = CHANNEL_BY_LABEL.get(normalizeLabel(text));
  if (channel) return { channel, channelDetail: null };
  const [, label = '', precision = ''] = WITH_PRECISION.exec(text.trim()) ?? [];
  const detail = precision.trim();
  return CHANNEL_BY_LABEL.get(normalizeLabel(label)) === OTHER_CHANNEL && detail !== ''
    ? { channel: OTHER_CHANNEL, channelDetail: detail }
    : null;
}
