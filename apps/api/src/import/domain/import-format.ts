import type {
  ApplicationChannel,
  ApplicationStatus,
  ApplicationTextField,
  WorkMode,
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

export const SKILL_COLUMN = { name: 0, pattern: 1, level: 4 } as const;

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
