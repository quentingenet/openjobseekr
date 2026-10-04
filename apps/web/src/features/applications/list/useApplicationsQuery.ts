import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import {
  APPLICATION_CHANNELS,
  APPLICATION_STATUSES,
  type ListApplicationsQuery,
} from '../../../api/types';

export const PAGE_SIZES = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 20;

export type QueryChanges = Record<string, string | null>;

function isOneOf<T extends string>(values: readonly T[], value: string | null): value is T {
  return value !== null && (values as readonly string[]).includes(value);
}

/** Reads the list query from URL parameters, ignoring invalid values. */
export function parseListQuery(params: URLSearchParams): ListApplicationsQuery {
  const status = params.get('status');
  const channel = params.get('channel');
  const limit = Number(params.get('limit'));
  const page = Number(params.get('page'));
  const pageSize = PAGE_SIZES.includes(limit) ? limit : DEFAULT_PAGE_SIZE;
  return {
    status: isOneOf(APPLICATION_STATUSES, status) ? status : undefined,
    channel: isOneOf(APPLICATION_CHANNELS, channel) ? channel : undefined,
    overdue: params.get('overdue') === 'true' || undefined,
    q: params.get('q') ?? undefined,
    order: params.get('order') === 'asc' ? 'asc' : 'desc',
    limit: pageSize,
    offset: Number.isInteger(page) && page > 0 ? page * pageSize : 0,
  };
}

/**
 * Filters, sort and pagination live in the URL: shareable, and kept by the back button.
 * `update` always uses the latest URL, so delayed calls (debounced search) never restore
 * filters changed in the meantime.
 */
export function useApplicationsQuery() {
  const [params, setParams] = useSearchParams();
  const query = parseListQuery(params);

  const update = (changes: QueryChanges) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes)) {
          if (value === null || value === '') next.delete(key);
          else next.set(key, value);
        }
        // Any filter change goes back to the first page.
        if (!('page' in changes)) next.delete('page');
        return next;
      },
      { replace: true },
    );
  };
  const latestUpdate = useRef(update);
  useEffect(() => {
    latestUpdate.current = update;
  });

  // Stable identity, safe in effect dependencies.
  const updateQuery = useCallback((changes: QueryChanges) => latestUpdate.current(changes), []);

  return {
    query,
    updateQuery,
    hasFilters: Boolean(query.status || query.channel || query.overdue || query.q),
  };
}
