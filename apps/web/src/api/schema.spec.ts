import openapiTS, { astToString, COMMENT_HEADER } from 'openapi-typescript';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');

describe('schema.d.ts', () => {
  it('is generated from the committed openapi.json (run `npm run api:types`)', async () => {
    const generated = COMMENT_HEADER + astToString(await openapiTS(read('./openapi.json')));

    expect(generated).toBe(read('./schema.d.ts'));
  });
});
