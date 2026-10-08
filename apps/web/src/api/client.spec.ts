import { afterEach, describe, expect, it, vi } from 'vitest';
import { type FetchStub, lastRequest } from '../test/api-mock';
import { jsonResponse } from '../test/render';
import { api, ApiError, unwrap, unwrapFile } from './client';
import { tokenStorage } from './token-storage';

describe('API client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    tokenStorage.clear();
  });

  it('calls the API through /api with the token, a JSON body and the query string', async () => {
    const fetchMock = vi.fn<FetchStub>().mockResolvedValue(jsonResponse({ id: '1' }, 201));
    vi.stubGlobal('fetch', fetchMock);
    tokenStorage.set('token-1');

    const result = await unwrap(
      api.POST('/applications', {
        body: { sentAt: '2026-10-01', company: 'Acme', jobTitle: 'Dev', status: 'SENT' },
      }),
    );

    expect(result).toEqual({ id: '1' });
    const request = lastRequest(fetchMock);
    expect(request.method).toBe('POST');
    expect(new URL(request.url).pathname).toBe('/api/applications');
    expect(request.headers.get('Authorization')).toBe('Bearer token-1');
    expect(request.headers.get('Accept')).toBe('application/json, application/problem+json');
    expect(await request.json()).toEqual({
      sentAt: '2026-10-01',
      company: 'Acme',
      jobTitle: 'Dev',
      status: 'SENT',
    });
  });

  it('sends no Authorization header without a token, and skips undefined query values', async () => {
    const fetchMock = vi.fn<FetchStub>().mockResolvedValue(jsonResponse({ items: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await unwrap(
      api.GET('/applications', {
        params: { query: { status: 'SENT', q: undefined, limit: 20, offset: 0, order: 'desc' } },
      }),
    );

    const request = lastRequest(fetchMock);
    expect(request.headers.has('Authorization')).toBe(false);
    expect(new URL(request.url).search).toBe('?status=SENT&limit=20&offset=0&order=desc');
  });

  it('turns an RFC 9457 problem into an ApiError with code, title and invalid fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            type: 'urn:openjobseekr:error:validation-failed',
            title: 'Validation failed',
            status: 400,
            instance: '/applications',
            code: 'VALIDATION_FAILED',
            errors: [{ field: 'company', constraints: ['isNotEmpty'] }],
          },
          400,
        ),
      ),
    );

    const error = await unwrap(
      api.POST('/applications', {
        body: { sentAt: '2026-10-01', company: '', jobTitle: 'Dev', status: 'SENT' },
      }),
    ).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).code).toBe('VALIDATION_FAILED');
    // Without a detail, the problem title is the message.
    expect((error as ApiError).message).toBe('Validation failed');
    expect((error as ApiError).fieldErrors).toEqual([
      { field: 'company', constraints: ['isNotEmpty'] },
    ]);
  });

  it('reports NETWORK_ERROR when the API cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const error = await unwrap(api.GET('/settings')).catch((e: unknown) => e);

    expect((error as ApiError).code).toBe('NETWORK_ERROR');
    expect((error as ApiError).status).toBe(0);
  });

  it('lets an aborted request reject with its AbortError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError')),
    );

    const error = await unwrap(api.GET('/settings')).catch((e: unknown) => e);

    expect((error as DOMException).name).toBe('AbortError');
  });

  it('returns undefined for 204 No Content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(
      unwrap(api.DELETE('/applications/{id}', { params: { path: { id: '1' } } })),
    ).resolves.toBeUndefined();
  });

  describe('unwrapFile', () => {
    const fileResponse = (disposition: string | null) =>
      new Response('file content', {
        headers: {
          'Content-Type': 'application/vnd.oasis.opendocument.spreadsheet',
          ...(disposition ? { 'Content-Disposition': disposition } : {}),
        },
      });

    it('returns the downloaded file and the name the API gives it', async () => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn<FetchStub>()
          .mockResolvedValue(
            fileResponse('attachment; filename="suivi_candidatures_2026-10-08.ods"'),
          ),
      );

      const file = await unwrapFile(
        api.GET('/export', { params: { query: { format: 'ods' } }, parseAs: 'blob' }),
      );

      expect(file.fileName).toBe('suivi_candidatures_2026-10-08.ods');
      expect(await file.blob.text()).toBe('file content');
    });

    it('has no name when the API gives none', async () => {
      vi.stubGlobal('fetch', vi.fn<FetchStub>().mockResolvedValue(fileResponse(null)));

      const file = await unwrapFile(
        api.GET('/export', { params: { query: { format: 'ods' } }, parseAs: 'blob' }),
      );

      expect(file.fileName).toBeNull();
    });

    it('turns a problem into an ApiError, like unwrap', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn<FetchStub>().mockResolvedValue(jsonResponse({ code: 'UNAUTHORIZED' }, 401)),
      );

      const error = await unwrapFile(
        api.GET('/export', { params: { query: { format: 'ods' } }, parseAs: 'blob' }),
      ).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).code).toBe('UNAUTHORIZED');
    });
  });
});
