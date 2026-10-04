import { APPLICATION_CHANNELS, APPLICATION_STATUSES, WORK_MODES } from '@openjobseekr/domain';
import { describe, expect, it } from 'vitest';
import openapi from '../api/openapi.json';
import en from './en/translation.json';
import es from './es/translation.json';
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
const others = { fr: flatten(fr), es: flatten(es) };
const placeholders = (value: string) => (value.match(/\{\{\w+\}\}/g) ?? []).sort();

describe.each(Object.entries(others))('translations: %s compared with en', (_language, keys) => {
  it('has every English key', () => {
    expect(Object.keys(enKeys).filter((key) => !(key in keys))).toEqual([]);
  });

  it('has no key missing in English', () => {
    expect(Object.keys(keys).filter((key) => !(key in enKeys))).toEqual([]);
  });

  it('has no empty translation', () => {
    expect(Object.keys(keys).filter((key) => keys[key]?.trim() === '')).toEqual([]);
  });

  it('uses the same {{placeholders}}', () => {
    const mismatched = Object.keys(enKeys).filter(
      (key) =>
        JSON.stringify(placeholders(enKeys[key] ?? '')) !==
        JSON.stringify(placeholders(keys[key] ?? '')),
    );
    expect(mismatched).toEqual([]);
  });
});

describe('translations: en', () => {
  it('has no empty translation', () => {
    expect(Object.keys(enKeys).filter((key) => enKeys[key]?.trim() === '')).toEqual([]);
  });

  it('translates every status, channel and work mode code', () => {
    expect(Object.keys(en.status).sort()).toEqual([...APPLICATION_STATUSES].sort());
    // UNSPECIFIED labels applications without a channel in the statistics.
    expect(Object.keys(en.channel).sort()).toEqual([...APPLICATION_CHANNELS, 'UNSPECIFIED'].sort());
    expect(Object.keys(en.workMode).sort()).toEqual([...WORK_MODES].sort());
  });

  it('translates every error code of the API, and the ones the client produces', () => {
    const apiCodes = openapi.components.schemas.ProblemDetailsDto.properties.code.enum;
    const missing = [...apiCodes, 'NETWORK_ERROR', 'UNKNOWN'].filter(
      (code) => !(code in en.errors),
    );

    expect(missing).toEqual([]);
  });
});
