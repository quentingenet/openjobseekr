import { tokenStorage } from './token-storage';

const API_BASE = '/api';

export interface FieldError {
  field: string;
  constraints: string[];
}

/** Error returned by the API (`{ code, message, details? }`) or a network failure. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get fieldErrors(): FieldError[] {
    return Array.isArray(this.details) ? (this.details as FieldError[]) : [];
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

/** Thin typed wrapper around fetch: adds the token, sends JSON, turns errors into ApiError. */
export async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
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
  if (!response.ok) {
    const body = (payload ?? {}) as { code?: string; message?: string; details?: unknown };
    throw new ApiError(
      response.status,
      body.code ?? 'UNKNOWN',
      body.message ?? response.statusText,
      body.details,
    );
  }
  return payload as T;
}
