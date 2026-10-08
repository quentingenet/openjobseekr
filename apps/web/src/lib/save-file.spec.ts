import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveFile } from './save-file';

describe('saveFile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('downloads the file under its name, then frees its URL', () => {
    // jsdom has no object URLs.
    const createObjectURL = vi.fn(() => 'blob:export');
    const revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const blob = new Blob(['content']);

    saveFile(blob, 'suivi.xlsx');

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.href).toBe('blob:export');
    expect(link.download).toBe('suivi.xlsx');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:export');
  });
});
