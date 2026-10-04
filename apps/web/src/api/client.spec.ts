import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse } from '../test/render';
import { ApiError, apiRequest } from './client';
import { tokenStorage } from './token-storage';

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the API through /api with the token, JSON body and query string', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    tokenStorage.set('token-1');

    const result = await apiRequest('POST', '/applications', {
      body: { company: 'Acme' },
      query: { status: 'SENT', q: '', overdue: undefined, limit: 20 },
    });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith('/api/applications?status=SENT&limit=20', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer token-1',
        'Content-Type': 'application/json',
      },
      body: '{"company":"Acme"}',
      signal: undefined,
    });
  });

  it('turns an error response into an ApiError with code and field details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            code: 'VALIDATION_FAILED',
            message: 'Request validation failed',
            details: [{ field: 'company', constraints: ['isNotEmpty'] }],
          },
          400,
        ),
      ),
    );

    const error = await apiRequest('POST', '/applications').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).code).toBe('VALIDATION_FAILED');
    expect((error as ApiError).fieldErrors).toEqual([
      { field: 'company', constraints: ['isNotEmpty'] },
    ]);
  });

  it('reports NETWORK_ERROR when the API cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const error = await apiRequest('GET', '/health').catch((e: unknown) => e);

    expect((error as ApiError).code).toBe('NETWORK_ERROR');
    expect((error as ApiError).status).toBe(0);
  });

  it('returns undefined for 204 No Content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(apiRequest('DELETE', '/applications/1')).resolves.toBeUndefined();
  });
});
