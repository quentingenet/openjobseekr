import { vi } from 'vitest';
import type { FieldError, ProblemDetails } from '../api/client';
import { jsonResponse } from './render';

type Handler = { status?: number; body?: unknown } | ((request: RecordedRequest) => Response);

export interface RecordedRequest {
  method: string;
  url: string;
  body: unknown;
}

/** Path and query string of a request sent by the API client (e.g. `/api/applications?q=a`). */
export function requestUrl(request: Request): string {
  const url = new URL(request.url);
  return url.pathname + url.search;
}

/** URLs of every request a stubbed `fetch` received, in order. */
export function requestedUrls(fetchMock: ReturnType<typeof vi.fn>): string[] {
  return fetchMock.mock.calls.map(([request]) => requestUrl(request as Request));
}

/**
 * Stubs `fetch` with handlers keyed by "METHOD /api/path" (query string ignored).
 * Unknown routes answer 404 so that unexpected calls are visible in tests.
 */
export function mockApi(handlers: Record<string, Handler>) {
  const requests: RecordedRequest[] = [];
  const fetchMock = vi.fn(async (sent: Request) => {
    const url = requestUrl(sent);
    const text = await sent.text();
    const request: RecordedRequest = {
      method: sent.method,
      url,
      body: text ? JSON.parse(text) : undefined,
    };
    requests.push(request);
    const handler = handlers[`${sent.method} ${url.split('?')[0]}`];
    if (!handler) {
      return jsonResponse({ code: 'NOT_FOUND', message: `No mock for ${sent.method} ${url}` }, 404);
    }
    if (typeof handler === 'function') return handler(request);
    if (handler.status === 204) return new Response(null, { status: 204 });
    return jsonResponse(handler.body, handler.status ?? 200);
  });
  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, requests };
}

/** An RFC 9457 problem body as the API sends it. */
export function problem(
  status: number,
  code: ProblemDetails['code'],
  errors?: FieldError[],
): ProblemDetails {
  return {
    type: `urn:openjobseekr:error:${code.toLowerCase().replaceAll('_', '-')}`,
    title: code,
    status,
    instance: '/test',
    code,
    ...(errors ? { errors } : {}),
  };
}
