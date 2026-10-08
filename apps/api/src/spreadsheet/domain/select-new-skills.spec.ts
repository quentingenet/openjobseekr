import { describe, expect, it } from 'vitest';
import { selectNewSkills } from './select-new-skills.js';

const skill = (row: number, name: string, pattern = name) => ({ row, name, pattern, level: null });

describe('selectNewSkills', () => {
  it('adds the skills the user does not have yet', () => {
    expect(selectNewSkills(['Java'], [skill(4, 'Go'), skill(5, 'Rust')])).toEqual({
      added: [
        { name: 'Go', pattern: 'Go', level: null },
        { name: 'Rust', pattern: 'Rust', level: null },
      ],
      ignored: [],
    });
  });

  it('keeps an existing skill as it is, whatever the case or a ".js" suffix', () => {
    expect(
      selectNewSkills(['TypeScript', 'React'], [skill(4, 'TYPESCRIPT'), skill(5, 'React.JS')]),
    ).toEqual({
      added: [],
      ignored: [
        { row: 4, name: 'TYPESCRIPT', keptName: 'TypeScript' },
        { row: 5, name: 'React.JS', keptName: 'React' },
      ],
    });
  });

  it('keeps the first of several rows with the same name', () => {
    const result = selectNewSkills(
      [],
      [
        skill(4, 'TypeScript', '\\bTypeScript\\b'),
        skill(5, 'React'),
        skill(6, 'typescript', 'TS'),
        skill(7, 'ReactJS'),
      ],
    );

    expect(result).toEqual({
      added: [
        { name: 'TypeScript', pattern: '\\bTypeScript\\b', level: null },
        { name: 'React', pattern: 'React', level: null },
      ],
      ignored: [
        { row: 6, name: 'typescript', keptName: 'TypeScript' },
        { row: 7, name: 'ReactJS', keptName: 'React' },
      ],
    });
  });
});
