import { describe, expect, it } from 'vitest';
import { checkSkillPattern, matchesSkill } from './skill-pattern.js';

describe('matchesSkill', () => {
  it('runs in linear time on patterns that make backtracking engines hang', () => {
    const text = `${'a'.repeat(50_000)}!`;
    const start = performance.now();

    expect(matchesSkill('(a+)+$', text)).toBe(false);
    expect(matchesSkill('(a|a)*b', text)).toBe(false);
    expect(matchesSkill('.*.*.*.*x', text)).toBe(false);

    expect(performance.now() - start).toBeLessThan(1_000);
  });

  it('matches case-insensitively, like REGEXMATCH((?i)…) in the spreadsheet', () => {
    expect(matchesSkill('\\bTypeScript\\b', 'Stack: typescript, React')).toBe(true);
  });

  it('does not match Java inside JavaScript with \\bJava\\b', () => {
    expect(matchesSkill('\\bJava\\b', 'Nous utilisons JavaScript et TypeScript')).toBe(false);
    expect(matchesSkill('\\bJava\\b', 'Backend en Java 21')).toBe(true);
  });

  it('does not match SQL inside NoSQL with \\bSQL\\b', () => {
    expect(matchesSkill('\\bSQL\\b', 'Base NoSQL (MongoDB)')).toBe(false);
    expect(matchesSkill('\\bSQL\\b', 'Bonne maîtrise du SQL')).toBe(true);
  });

  it('supports alternatives and optional groups', () => {
    expect(matchesSkill('\\bReact(\\.?js)?\\b', 'Expérience ReactJS')).toBe(true);
    expect(matchesSkill('\\bReact(\\.?js)?\\b', 'Expérience React.js')).toBe(true);
    expect(matchesSkill('\\bKubernetes\\b|\\bK8s\\b', 'Déploiement sur k8s')).toBe(true);
  });

  it('never matches an empty or missing text', () => {
    expect(matchesSkill('\\bReact\\b', '')).toBe(false);
    expect(matchesSkill('\\bReact\\b', null)).toBe(false);
  });
});

describe('checkSkillPattern', () => {
  it.each([
    '\\bReact(\\.?js)?\\b',
    'CI/CD|\\bCI\\b|intégration continue',
    'assistants? .{0,25}\\bIA\\b',
    '(s|ing)?',
  ])('accepts %s', (pattern) => {
    expect(checkSkillPattern(pattern)).toBe('VALID');
  });

  it.each(['(unclosed', '[a-', '*start', 'a{2,1}'])(
    'rejects the invalid regular expression %s',
    (pattern) => {
      expect(checkSkillPattern(pattern)).toBe('INVALID_SYNTAX');
    },
  );

  it.each(['(?=lookahead)', '(a)\\1'])(
    'rejects %s: not supported by RE2, the engine of Google Sheets',
    (pattern) => {
      expect(checkSkillPattern(pattern)).toBe('INVALID_SYNTAX');
    },
  );

  it('accepts nested repetitions: RE2 matches in linear time, they cannot freeze the API', () => {
    expect(checkSkillPattern('(a+)+$')).toBe('VALID');
  });

  it('rejects an empty or blank pattern', () => {
    expect(checkSkillPattern('')).toBe('INVALID_SYNTAX');
    expect(checkSkillPattern('   ')).toBe('INVALID_SYNTAX');
  });
});
