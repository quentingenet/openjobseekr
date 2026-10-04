import { vi } from 'vitest';

/**
 * Simulates a phone screen: jsdom has no `matchMedia`, so MUI media queries never match
 * (desktop layout) unless this stub is installed. Max-width queries match, min-width ones do not.
 * Undo it with `vi.unstubAllGlobals()`.
 */
export function mockMobileViewport() {
  vi.stubGlobal(
    'matchMedia',
    (query: string): MediaQueryList =>
      ({
        matches: query.includes('max-width'),
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}
