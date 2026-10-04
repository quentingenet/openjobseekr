import RE2 from 're2';

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
  return (text) => (text ? regex.test(text) : false);
}

/**
 * Valid RE2 syntax (no lookarounds or backreferences). A blank pattern is rejected: it would
 * match nearly everything.
 */
export function isValidSkillPattern(pattern: string): boolean {
  if (pattern.trim() === '') return false;
  try {
    compile(pattern);
    return true;
  } catch {
    return false;
  }
}
