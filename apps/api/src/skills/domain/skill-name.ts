/**
 * Two skill names with the same key are the same skill: "TypeScript", "TYPESCRIPT" and
 * "typescript", or "React", "REACT" and "React.js". Symbols are kept, so "C", "C#" and "C++"
 * stay distinct.
 */
export function skillNameKey(name: string): string {
  const key = name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  const withoutJsSuffix = key.replace(/[\s.-]?js$/, '');
  return withoutJsSuffix === '' ? key : withoutJsSuffix;
}
