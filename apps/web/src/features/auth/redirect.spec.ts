import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from './redirect';

describe('safeRedirectPath', () => {
  it('keeps an in-app path with its query string', () => {
    expect(safeRedirectPath('/applications?status=SENT')).toBe('/applications?status=SENT');
  });

  it.each([undefined, null, 42, '', 'https://evil.example', '//evil.example', 'applications'])(
    'falls back for %j',
    (from) => {
      expect(safeRedirectPath(from)).toBe('/applications');
    },
  );
});
