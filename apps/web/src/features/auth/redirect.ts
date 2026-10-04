/** Only in-app paths are accepted as the page to return to after logging in. */
export function safeRedirectPath(from: unknown, fallback = '/applications'): string {
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//')) return fallback;
  return from;
}
