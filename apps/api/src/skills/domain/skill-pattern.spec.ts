import { describe, expect, it } from 'vitest';
import { createSkillMatcher, isValidSkillPattern } from './skill-pattern.js';

describe('createSkillMatcher', () => {
  it('runs in linear time on patterns that make backtracking engines hang', () => {
    const text = `${'a'.repeat(50_000)}!`;
    const start = performance.now();

    expect(createSkillMatcher('(a+)+$')(text)).toBe(false);
    expect(createSkillMatcher('(a|a)*b')(text)).toBe(false);
    expect(createSkillMatcher('.*.*.*.*x')(text)).toBe(false);

    expect(performance.now() - start).toBeLessThan(1_000);
  });

  it('matches case-insensitively, like REGEXMATCH((?i)…) in the spreadsheet', () => {
    expect(createSkillMatcher('\\bTypeScript\\b')('Stack: typescript, React')).toBe(true);
  });

  it('does not match Java inside JavaScript with \\bJava\\b', () => {
    expect(createSkillMatcher('\\bJava\\b')('Nous utilisons JavaScript et TypeScript')).toBe(false);
    expect(createSkillMatcher('\\bJava\\b')('Backend en Java 21')).toBe(true);
  });

  it('does not match SQL inside NoSQL with \\bSQL\\b', () => {
    expect(createSkillMatcher('\\bSQL\\b')('Base NoSQL (MongoDB)')).toBe(false);
    expect(createSkillMatcher('\\bSQL\\b')('Bonne maîtrise du SQL')).toBe(true);
  });

  it('supports alternatives and optional groups', () => {
    expect(createSkillMatcher('\\bReact(\\.?js)?\\b')('Expérience ReactJS')).toBe(true);
    expect(createSkillMatcher('\\bReact(\\.?js)?\\b')('Expérience React.js')).toBe(true);
    expect(createSkillMatcher('\\bKubernetes\\b|\\bK8s\\b')('Déploiement sur k8s')).toBe(true);
  });

  it('never matches an empty or missing text', () => {
    expect(createSkillMatcher('\\bReact\\b')('')).toBe(false);
    expect(createSkillMatcher('\\bReact\\b')(null)).toBe(false);
  });
});

describe('isValidSkillPattern', () => {
  it.each([
    '\\bReact(\\.?js)?\\b',
    'CI/CD|\\bCI\\b|intégration continue',
    'assistants? .{0,25}\\bIA\\b',
    '(s|ing)?',
  ])('accepts %s', (pattern) => {
    expect(isValidSkillPattern(pattern)).toBe(true);
  });

  it.each(['(unclosed', '[a-', '*start', 'a{2,1}'])(
    'rejects the invalid regular expression %s',
    (pattern) => {
      expect(isValidSkillPattern(pattern)).toBe(false);
    },
  );

  it.each(['(?=lookahead)', '(a)\\1'])(
    'rejects %s: not supported by RE2, the engine of Google Sheets',
    (pattern) => {
      expect(isValidSkillPattern(pattern)).toBe(false);
    },
  );

  it('accepts nested repetitions: RE2 matches in linear time, they cannot freeze the API', () => {
    expect(isValidSkillPattern('(a+)+$')).toBe(true);
  });

  it('rejects an empty or blank pattern', () => {
    expect(isValidSkillPattern('')).toBe(false);
    expect(isValidSkillPattern('   ')).toBe(false);
  });
});
