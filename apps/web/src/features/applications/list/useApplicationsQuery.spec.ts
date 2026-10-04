import { MAX_OFFSET, SEARCH_MAX_LENGTH } from '@openjobseekr/domain';
import { describe, expect, it } from 'vitest';
import { parseListQuery } from './useApplicationsQuery';

describe('parseListQuery', () => {
  it('reads filters, sort and pagination from the URL', () => {
    const params = new URLSearchParams(
      'status=REJECTED&channel=APEC&overdue=true&q=acme&order=asc&limit=10&page=2',
    );

    expect(parseListQuery(params)).toEqual({
      status: 'REJECTED',
      channel: 'APEC',
      overdue: true,
      q: 'acme',
      order: 'asc',
      limit: 10,
      offset: 20,
    });
  });

  it('falls back to defaults for missing or invalid values', () => {
    const params = new URLSearchParams('status=WAITING&channel=TWITTER&order=up&limit=7&page=-1');

    expect(parseListQuery(params)).toEqual({
      status: undefined,
      channel: undefined,
      overdue: undefined,
      q: undefined,
      order: 'desc',
      limit: 20,
      offset: 0,
    });
  });

  it('bounds the search and the page, which the API would reject otherwise', () => {
    const params = new URLSearchParams(`q=${'a'.repeat(SEARCH_MAX_LENGTH + 50)}&page=1e12`);

    const query = parseListQuery(params);

    expect(query.q).toBe('a'.repeat(SEARCH_MAX_LENGTH));
    expect(query.offset).toBe(MAX_OFFSET);
  });
});
