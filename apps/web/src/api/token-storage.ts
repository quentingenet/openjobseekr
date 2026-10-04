// localStorage is readable by any script on the page: acceptable here because the app is
// local-only and loads no third-party scripts; a hosted version should use an HttpOnly
// cookie. Storage can be unavailable (private mode), so every access is guarded.
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
      // Ignored: the token is then lost, so the next API call answers 401 and logs out.
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
