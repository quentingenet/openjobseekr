import { describe, expect, it } from 'vitest';
import { skillNameKey } from './skill-name.js';

describe('skillNameKey', () => {
  it('ignores case and surrounding spaces', () => {
    expect(skillNameKey('TypeScript')).toBe('typescript');
    expect(skillNameKey('  TYPESCRIPT ')).toBe('typescript');
    expect(skillNameKey('Java')).toBe(skillNameKey('JAVA'));
  });

  it('ignores a ".js" or "JS" suffix', () => {
    expect(skillNameKey('React.JS')).toBe('react');
    expect(skillNameKey('ReactJS')).toBe('react');
    expect(skillNameKey('Node.js')).toBe(skillNameKey('Node'));
    expect(skillNameKey('Vue js')).toBe('vue');
  });

  it('keeps names that only differ by symbols apart', () => {
    expect(skillNameKey('C')).not.toBe(skillNameKey('C++'));
    expect(skillNameKey('C#')).not.toBe(skillNameKey('C'));
    expect(skillNameKey('Java')).not.toBe(skillNameKey('JavaScript'));
  });

  it('keeps "JS" itself', () => {
    expect(skillNameKey('JS')).toBe('js');
  });

  it('collapses inner spaces', () => {
    expect(skillNameKey('Spring   Boot')).toBe('spring boot');
  });
});
