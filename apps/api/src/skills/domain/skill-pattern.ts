import RE2 from 're2';

export type SkillPatternCheck = 'VALID' | 'INVALID_SYNTAX';

/**
 * RE2 is the engine behind Google Sheets' REGEXMATCH, so results match the original sheet.
 * It runs in linear time: no pattern can make matching hang (no ReDoS), unlike JavaScript's
 * backtracking RegExp. The `i` flag mirrors the sheet's `(?i)` prefix.
 */
function compile(pattern: string): RE2 {
  return new RE2(pattern, 'i');
}

/** Compiles the pattern once, for matching it against many texts. */
export function createSkillMatcher(pattern: string): (text: string | null) => boolean {
  const regex = compile(pattern);
  return (text) => Boolean(text) && regex.test(text as string);
}

/** Valid RE2 syntax (no lookarounds or backreferences). A blank pattern would match nearly everything. */
export function checkSkillPattern(pattern: string): SkillPatternCheck {
  if (pattern.trim() === '') return 'INVALID_SYNTAX';
  try {
    compile(pattern);
    return 'VALID';
  } catch {
    return 'INVALID_SYNTAX';
  }
}
