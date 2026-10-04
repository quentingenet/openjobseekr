import createClient from 'openapi-fetch';
import type { components, paths } from './schema';
import { tokenStorage } from './token-storage';

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

/**
 * Typed client generated from the OpenAPI document: the path, method, parameters, body and
 * response types all come from `schema.d.ts`. The base URL is absolute because `Request`
 * needs one; in the browser it is the page origin (the dev server proxies /api).
 */
export const api = createClient<paths>({
  baseUrl: `${window.location.origin}/api`,
  headers: { Accept: 'application/json, application/problem+json' },
  // Resolved on each call, so that tests can stub the global fetch.
  fetch: (request) => globalThis.fetch(request),
});

api.use({
  onRequest({ request }) {
    const token = tokenStorage.get();
    if (token) request.headers.set('Authorization', `Bearer ${token}`);
    return request;
  },
});

type ClientResult =
  | { data: unknown; error?: never; response: Response }
  | { data?: never; error: unknown; response: Response };

/** The data type of the success branch only (inferring it from both would add `undefined`). */
type SuccessData<Result> = Result extends { data: infer Data; error?: never } ? Data : never;

/** The data of a successful call; otherwise an ApiError (RFC 9457 problem or network failure). */
export async function unwrap<Result extends ClientResult>(
  call: Promise<Result>,
): Promise<SuccessData<Result>> {
  let result: Result;
  try {
    result = await call;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'NETWORK_ERROR', 'The API could not be reached');
  }
  // openapi-fetch only sets `error` on failed responses.
  if ('error' in result) throw ApiError.fromProblem(result.response.status, result.error);
  // TypeScript cannot narrow a generic union: this is the success branch, checked just above.
  return result.data as SuccessData<Result>;
}
