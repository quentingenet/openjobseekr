import { describe, expect, it } from 'vitest';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, PAGE_SIZES } from './limits.js';

describe('page sizes', () => {
  it('offers the default page size', () => {
    expect(PAGE_SIZES).toContain(DEFAULT_PAGE_SIZE);
  });

  it('never offers more than the API accepts', () => {
    expect(Math.max(...PAGE_SIZES)).toBeLessThanOrEqual(MAX_PAGE_SIZE);
  });
});
