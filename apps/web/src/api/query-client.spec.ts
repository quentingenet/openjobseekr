import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './client';
import { handleQueryError, onSessionExpired, shouldRetry } from './query-client';

describe('handleQueryError', () => {
  it('notifies session expiry on UNAUTHORIZED only', () => {
    const listener = vi.fn();
    const unsubscribe = onSessionExpired(listener);

    handleQueryError(new ApiError(401, 'INVALID_CREDENTIALS', 'Wrong password'));
    handleQueryError(new ApiError(404, 'APPLICATION_NOT_FOUND', 'Not found'));
    expect(listener).not.toHaveBeenCalled();

    handleQueryError(new ApiError(401, 'UNAUTHORIZED', 'Expired'));
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    handleQueryError(new ApiError(401, 'UNAUTHORIZED', 'Expired'));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('shouldRetry', () => {
  it('never retries client errors', () => {
    expect(shouldRetry(0, new ApiError(404, 'APPLICATION_NOT_FOUND', 'Not found'))).toBe(false);
    expect(shouldRetry(0, new ApiError(401, 'UNAUTHORIZED', 'Expired'))).toBe(false);
  });

  it('retries network and server errors twice', () => {
    const networkError = new ApiError(0, 'NETWORK_ERROR', 'Unreachable');
    expect(shouldRetry(0, networkError)).toBe(true);
    expect(shouldRetry(1, new ApiError(500, 'INTERNAL_ERROR', 'Boom'))).toBe(true);
    expect(shouldRetry(2, networkError)).toBe(false);
  });
});
