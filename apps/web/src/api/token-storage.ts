// The access token is kept in localStorage: acceptable for a local-only app (see
// docs/decisions.md). Storage can be unavailable (private mode), so every access is guarded.
const TOKEN_KEY = 'openjobseekr.accessToken';

export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Ignored: the session then only lasts until the page is reloaded.
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignored.
    }
  },
};
