/** What identifies an application across imports, and its follow-up date picked by hand. */
interface FollowUpRow {
  sentAt: string;
  company: string;
  jobTitle: string;
  followUpOverride: string | null;
}

/** Same sent date, company and job title, ignoring case and spaces. */
function applicationKey({ sentAt, company, jobTitle }: FollowUpRow): string {
  const normalize = (text: string) =>
    text.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
  return [sentAt, normalize(company), normalize(jobTitle)].join('\n');
}

/** Rows by key; `null` for a key found more than once (an ambiguous key matches nothing). */
function uniqueByKey<Row extends FollowUpRow>(rows: readonly Row[]): Map<string, Row | null> {
  const byKey = new Map<string, Row | null>();
  for (const row of rows) {
    const key = applicationKey(row);
    byKey.set(key, byKey.has(key) ? null : row);
  }
  return byKey;
}

/**
 * An import recreates the applications: the follow-up dates picked in the app would be lost.
 * They are kept for the applications found again in the file, unless the file has its own date
 * typed by hand (a formula date is not a choice, so it never erases one).
 */
export function keepFollowUpDates<Row extends FollowUpRow>(
  imported: readonly Row[],
  existing: readonly FollowUpRow[],
): { applications: Row[]; kept: number } {
  const existingByKey = uniqueByKey(existing);
  const importedByKey = uniqueByKey(imported);
  let kept = 0;
  const applications = imported.map((row) => {
    const key = applicationKey(row);
    const previous = importedByKey.get(key) ? existingByKey.get(key) : null;
    if (row.followUpOverride !== null || !previous?.followUpOverride) return row;
    kept++;
    return { ...row, followUpOverride: previous.followUpOverride };
  });
  return { applications, kept };
}
