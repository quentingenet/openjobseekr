import { vi } from 'vitest';
import { jsonResponse } from './render';

type Handler = { status?: number; body?: unknown } | ((request: RecordedRequest) => Response);

export interface RecordedRequest {
  method: string;
  url: string;
  body: unknown;
}

/**
 * Stubs `fetch` with handlers keyed by "METHOD /api/path" (query string ignored).
 * Unknown routes answer 404 so that unexpected calls are visible in tests.
 */
export function mockApi(handlers: Record<string, Handler>) {
  const requests: RecordedRequest[] = [];
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    const request: RecordedRequest = {
      method,
      url,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    };
    requests.push(request);
    const handler = handlers[`${method} ${url.split('?')[0]}`];
    if (!handler) {
      return Promise.resolve(
        jsonResponse({ code: 'NOT_FOUND', message: `No mock for ${method} ${url}` }, 404),
      );
    }
    if (typeof handler === 'function') return Promise.resolve(handler(request));
    if (handler.status === 204) return Promise.resolve(new Response(null, { status: 204 }));
    return Promise.resolve(jsonResponse(handler.body, handler.status ?? 200));
  });
  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, requests };
}
