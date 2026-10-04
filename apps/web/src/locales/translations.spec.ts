import { describe, expect, it } from 'vitest';
import en from './en/translation.json';
import fr from './fr/translation.json';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((keys, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string'
      ? { ...keys, [path]: value }
      : { ...keys, ...flatten(value, path) };
  }, {});
}

const enKeys = flatten(en);
const frKeys = flatten(fr);

describe('translations', () => {
  it('has every English key in French', () => {
    expect(Object.keys(enKeys).filter((key) => !(key in frKeys))).toEqual([]);
  });

  it('has every French key in English', () => {
    expect(Object.keys(frKeys).filter((key) => !(key in enKeys))).toEqual([]);
  });

  it('has no empty translation', () => {
    const empty = [...Object.entries(enKeys), ...Object.entries(frKeys)]
      .filter(([, value]) => value.trim() === '')
      .map(([key]) => key);
    expect(empty).toEqual([]);
  });

  it('uses the same {{placeholders}} in both languages', () => {
    const placeholders = (value: string) => (value.match(/\{\{\w+\}\}/g) ?? []).sort();
    const mismatched = Object.keys(enKeys).filter(
      (key) =>
        JSON.stringify(placeholders(enKeys[key] ?? '')) !==
        JSON.stringify(placeholders(frKeys[key] ?? '')),
    );
    expect(mismatched).toEqual([]);
  });

  it('translates every status, channel and work mode code', () => {
    expect(Object.keys(en.status)).toEqual([
      'SENT',
      'RESPONSE_RECEIVED',
      'HR_INTERVIEW',
      'TECHNICAL_INTERVIEW',
      'OFFER',
      'REJECTED',
      'NO_RESPONSE',
    ]);
    expect(Object.keys(en.channel)).toHaveLength(10);
    expect(Object.keys(en.workMode)).toEqual(['ONSITE', 'HYBRID', 'FULL_REMOTE', 'UNSPECIFIED']);
  });
});
