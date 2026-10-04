import { describe, expect, it } from 'vitest';
import { computeSkillStats } from './skill-stats.js';

const skills = [
  { id: 's1', name: 'Java', pattern: '\\bJava\\b', level: 2 },
  { id: 's2', name: 'TypeScript', pattern: '\\bTypeScript\\b', level: null },
  { id: 's3', name: 'PostgreSQL / SQL', pattern: '\\bSQL\\b|PostgreSQL', level: 4 },
  { id: 's4', name: 'Rust', pattern: '\\bRust\\b', level: null },
];

const postings = [
  'Full stack TypeScript, PostgreSQL',
  'Frontend JavaScript and TypeScript, NoSQL database',
  'Backend Java and SQL',
  null, // an application without posting text is not analysed
  '   ',
];

describe('computeSkillStats', () => {
  it('counts postings per skill, sorted by frequency then name', () => {
    expect(computeSkillStats(skills, postings)).toEqual({
      postingsAnalyzed: 3,
      skills: [
        {
          id: 's3',
          name: 'PostgreSQL / SQL',
          pattern: '\\bSQL\\b|PostgreSQL',
          level: 4,
          postingCount: 2,
          frequency: 2 / 3,
        },
        {
          id: 's2',
          name: 'TypeScript',
          pattern: '\\bTypeScript\\b',
          level: null,
          postingCount: 2,
          frequency: 2 / 3,
        },
        {
          id: 's1',
          name: 'Java',
          pattern: '\\bJava\\b',
          level: 2,
          postingCount: 1,
          frequency: 1 / 3,
        },
        {
          id: 's4',
          name: 'Rust',
          pattern: '\\bRust\\b',
          level: null,
          postingCount: 0,
          frequency: 0,
        },
      ],
    });
  });

  it('has a null frequency when no posting text was saved', () => {
    expect(computeSkillStats(skills.slice(0, 1), [null, ''])).toEqual({
      postingsAnalyzed: 0,
      skills: [
        {
          id: 's1',
          name: 'Java',
          pattern: '\\bJava\\b',
          level: 2,
          postingCount: 0,
          frequency: null,
        },
      ],
    });
  });

  it('returns an empty list without skills', () => {
    expect(computeSkillStats([], ['TypeScript'])).toEqual({ postingsAnalyzed: 1, skills: [] });
  });
});
