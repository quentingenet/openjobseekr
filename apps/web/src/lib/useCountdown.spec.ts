import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCountdown } from './useCountdown';

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: 1_000_000 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts down to the end time, then stays at zero', () => {
    const { result } = renderHook(() => useCountdown(1_000_000 + 10_000));
    expect(result.current).toBe(10_000);

    act(() => {
      vi.advanceTimersByTime(4_000);
    });
    expect(result.current).toBe(6_000);

    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    expect(result.current).toBe(0);
  });

  it('is zero without an end time', () => {
    const { result } = renderHook(() => useCountdown(undefined));
    expect(result.current).toBe(0);
  });
});
