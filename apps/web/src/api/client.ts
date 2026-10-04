import type { components } from './schema';
import { tokenStorage } from './token-storage';

const API_BASE = '/api';

export type ProblemDetails = components['schemas']['ProblemDetailsDto'];
export type FieldError = NonNullable<ProblemDetails['errors']>[number];
/** API error codes, plus the two the client produces itself. */
export type ApiErrorCode = ProblemDetails['code'] | 'NETWORK_ERROR' | 'UNKNOWN';

/** An RFC 9457 problem returned by the API, or a network failure. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    /** Invalid fields of a VALIDATION_FAILED problem. */
    readonly fieldErrors: FieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromProblem(status: number, payload: unknown): ApiError {
    const problem = (payload ?? {}) as Partial<ProblemDetails>;
    return new ApiError(
      status,
      problem.code ?? 'UNKNOWN',
      problem.detail ?? problem.title ?? `HTTP ${status}`,
      problem.errors ?? [],
    );
  }
}

type QueryValue = string | number | boolean | undefined;

export interface RequestOptions {
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const search = params.toString();
  return `${API_BASE}${path}${search ? `?${search}` : ''}`;
}

/** Thin typed wrapper around fetch: adds the token, sends JSON, turns problems into ApiError. */
export async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json, application/problem+json',
  };
  const token = tokenStorage.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'NETWORK_ERROR', 'The API could not be reached');
  }

  if (response.status === 204) return undefined as T;
  const payload: unknown = await response.json().catch(() => undefined);
  if (!response.ok) throw ApiError.fromProblem(response.status, payload);
  return payload as T;
}
