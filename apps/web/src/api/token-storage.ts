// localStorage is readable by any script on the page: acceptable here because the app is
// local-only and loads no third-party scripts. Switch to an HttpOnly cookie if it is ever
// deployed. Storage can be unavailable (private mode), so every access is guarded.
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
      // Nothing to remove when storage is unavailable.
    }
  },
};
