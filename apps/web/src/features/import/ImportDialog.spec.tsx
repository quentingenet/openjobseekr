import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ImportResult } from '../../api/types';
import { mockApi, problem } from '../../test/api-mock';
import { renderWithProviders } from '../../test/render';
import { ImportDialog } from './ImportDialog';

const result: ImportResult = {
  deletedApplications: 3,
  importedApplications: 12,
  addedSkills: 2,
  ignoredSkills: [{ row: 6, name: 'TYPESCRIPT', keptName: 'TypeScript' }],
};

const xlsx = (name = 'suivi.xlsx', size = 1_000) =>
  new File([new Uint8Array(size)], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

async function renderDialog() {
  const onClose = vi.fn();
  const onImported = vi.fn();
  await renderWithProviders(<ImportDialog open onClose={onClose} onImported={onImported} />, {
    language: 'fr',
  });
  const dialog = screen.getByRole('dialog');
  return { dialog, onClose, onImported };
}

describe('ImportDialog', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('warns that applications are replaced and skills added, and links the templates', async () => {
    mockApi({});
    const { dialog } = await renderDialog();

    expect(within(dialog).getByText('Vos candidatures vont être remplacées')).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'Si vous cliquez sur OK, toutes vos candidatures actuelles sont définitivement supprimées et remplacées par celles du fichier.',
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "Les compétences s'ajoutent : les vôtres sont conservées, et celles du fichier que vous avez déjà sont ignorées.",
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: '.xlsx' })).toHaveAttribute(
      'href',
      '/templates/suivi_candidatures_modele.xlsx',
    );
    expect(within(dialog).getByRole('link', { name: '.ods' })).toHaveAttribute(
      'href',
      '/templates/suivi_candidatures_modele.ods',
    );
    expect(within(dialog).getByRole('button', { name: 'OK, importer' })).toBeDisabled();
  });

  it('sends the chosen file only after OK, then reports the result', async () => {
    const user = userEvent.setup();
    const { requests } = mockApi({ 'POST /api/import': { body: result } });
    const { dialog, onImported } = await renderDialog();

    await user.upload(within(dialog).getByLabelText('Choisir un fichier'), xlsx());
    expect(within(dialog).getByText('suivi.xlsx')).toBeInTheDocument();
    expect(requests).toEqual([]);

    await user.click(within(dialog).getByRole('button', { name: 'OK, importer' }));

    await waitFor(() => expect(onImported).toHaveBeenCalledWith(result));
    expect(requests).toHaveLength(1);
    expect(requests[0]?.url).toBe('/api/import');
    expect((requests[0]?.body as { file: File }).file.name).toBe('suivi.xlsx');
  });

  it('rejects another format or a file too large before sending it', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { requests } = mockApi({});
    const { dialog } = await renderDialog();
    const input = within(dialog).getByLabelText('Choisir un fichier');

    await user.upload(input, xlsx('suivi.csv'));
    expect(within(dialog).getByText('Choisissez un fichier .xlsx ou .ods.')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'OK, importer' })).toBeDisabled();

    await user.upload(input, xlsx('big.xlsx', 5 * 1024 * 1024 + 1));
    expect(within(dialog).getByText('Ce fichier dépasse 5 Mo.')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'OK, importer' })).toBeDisabled();
    expect(requests).toEqual([]);
  });

  it('lists the cells to fix when the API rejects the file', async () => {
    const user = userEvent.setup();
    mockApi({
      'POST /api/import': {
        status: 422,
        body: problem(422, 'IMPORT_INVALID_DATA', [
          { field: 'Candidatures!A3', constraints: ['isCalendarDate'] },
          { field: 'Compétences', constraints: ['missingSheet'] },
        ]),
      },
    });
    const { dialog, onImported } = await renderDialog();

    await user.upload(within(dialog).getByLabelText('Choisir un fichier'), xlsx());
    await user.click(within(dialog).getByRole('button', { name: 'OK, importer' }));

    expect(
      await within(dialog).findByText(
        "Certaines cellules sont invalides. Rien n'a été modifié : corrigez-les puis importez à nouveau le fichier.",
      ),
    ).toBeInTheDocument();
    const cells = within(within(dialog).getByRole('list', { name: 'Cellules à corriger' }));
    expect(cells.getByText('Onglet « Candidatures », cellule A3')).toBeInTheDocument();
    expect(cells.getByText('date invalide (JJ/MM/AAAA)')).toBeInTheDocument();
    expect(cells.getByText('Onglet « Compétences »')).toBeInTheDocument();
    expect(cells.getByText('onglet manquant')).toBeInTheDocument();
    expect(onImported).not.toHaveBeenCalled();
  });

  it('closes without sending anything on cancel', async () => {
    const user = userEvent.setup();
    const { requests } = mockApi({});
    const { dialog, onClose } = await renderDialog();

    await user.upload(within(dialog).getByLabelText('Choisir un fichier'), xlsx());
    await user.click(within(dialog).getByRole('button', { name: 'Annuler' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(requests).toEqual([]);
  });
});
