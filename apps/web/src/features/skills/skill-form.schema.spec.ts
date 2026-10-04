import { describe, expect, it } from 'vitest';
import { isValidRegex, skillFormSchema, toSkillInput } from './skill-form.schema';

describe('skill form', () => {
  it('accepts a valid skill and turns "not rated" into null', () => {
    const values = skillFormSchema.parse({ name: ' Java ', pattern: '\\bJava\\b', level: '' });

    expect(toSkillInput(values)).toEqual({ name: 'Java', pattern: '\\bJava\\b', level: null });
  });

  it('rejects an invalid regular expression before calling the API', () => {
    const result = skillFormSchema.safeParse({ name: 'Broken', pattern: '(unclosed', level: 2 });

    expect(result.error?.issues.map((issue) => [issue.path.join('.'), issue.message])).toEqual([
      ['pattern', 'validation.regex'],
    ]);
  });

  it('rejects a blank pattern, which would match nearly every posting', () => {
    const result = skillFormSchema.safeParse({ name: 'Blank', pattern: '   ', level: '' });

    expect(result.error?.issues.map((issue) => issue.message)).toEqual(['validation.required']);
  });

  it.each([
    ['\\bReact(\\.?js)?\\b', true],
    ['[a-', false],
  ])('isValidRegex(%s) is %s', (pattern, expected) => {
    expect(isValidRegex(pattern)).toBe(expected);
  });
});
