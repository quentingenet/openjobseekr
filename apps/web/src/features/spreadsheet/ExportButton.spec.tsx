import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockApi, problem } from '../../test/api-mock';
import { jsonResponse, renderWithProviders } from '../../test/render';
import { ExportButton } from './ExportButton';

const saveFile = vi.hoisted(() => vi.fn());
vi.mock('../../lib/save-file', () => ({ saveFile }));

describe('ExportButton', () => {
  beforeEach(() => {
    saveFile.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('downloads the chosen format under the name the API gives', async () => {
    const user = userEvent.setup();
    const { requests } = mockApi({
      'GET /api/export': () =>
        new Response('spreadsheet', {
          headers: {
            'Content-Type': 'application/vnd.oasis.opendocument.spreadsheet',
            'Content-Disposition': 'attachment; filename="suivi_candidatures_2026-10-08.ods"',
          },
        }),
    });
    await renderWithProviders(<ExportButton />, { language: 'fr' });

    await user.click(screen.getByRole('button', { name: 'Exporter' }));
    await user.click(screen.getByRole('menuitem', { name: 'OpenDocument (.ods)' }));

    await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(1));
    expect(requests.map((request) => request.url)).toEqual(['/api/export?format=ods']);
    expect(saveFile.mock.calls[0]?.[1]).toBe('suivi_candidatures_2026-10-08.ods');
  });

  it('shows the error when the export fails', async () => {
    const user = userEvent.setup();
    mockApi({ 'GET /api/export': () => jsonResponse(problem(401, 'UNAUTHORIZED'), 401) });
    await renderWithProviders(<ExportButton />, { language: 'fr' });

    await user.click(screen.getByRole('button', { name: 'Exporter' }));
    await user.click(screen.getByRole('menuitem', { name: 'Excel (.xlsx)' }));

    expect(
      await screen.findByText('Votre session a expiré. Reconnectez-vous.'),
    ).toBeInTheDocument();
    expect(saveFile).not.toHaveBeenCalled();
  });
});
