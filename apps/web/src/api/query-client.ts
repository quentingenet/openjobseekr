import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from './client';

type Listener = () => void;
const sessionExpiredListeners = new Set<Listener>();

/** Called when the API rejects the token (expired or invalid). Returns an unsubscribe function. */
export function onSessionExpired(listener: Listener): () => void {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}

export function handleQueryError(error: unknown): void {
  // INVALID_CREDENTIALS (wrong password) is also a 401 but must not log out.
  if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
    sessionExpiredListeners.forEach((listener) => listener());
  }
}

/** Client errors (401, 404, validation) will not change on retry; network/server errors may. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  const isClientError = error instanceof ApiError && error.status >= 400 && error.status < 500;
  return !isClientError && failureCount < 2;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError: handleQueryError }),
    mutationCache: new MutationCache({ onError: handleQueryError }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
      },
    },
  });
}
