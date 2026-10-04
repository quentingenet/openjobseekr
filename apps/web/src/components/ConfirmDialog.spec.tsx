import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import i18n from '../i18n';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  async function renderDialog(props: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
    await i18n.changeLanguage('fr');
    const handlers = { onConfirm: vi.fn(), onCancel: vi.fn() };
    render(
      <ConfirmDialog
        open
        title="Supprimer ?"
        message="Action définitive."
        confirmLabel="Supprimer"
        {...handlers}
        {...props}
      />,
    );
    return handlers;
  }

  it('confirms or cancels, with the focus on cancel', async () => {
    const { onConfirm, onCancel } = await renderDialog();

    expect(screen.getByRole('button', { name: 'Annuler' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows the translated error of the action', async () => {
    await renderDialog({ error: new ApiError(404, 'SKILL_NOT_FOUND', 'Skill not found') });

    expect(
      screen.getByText("Cette compétence n'existe pas ou a été supprimée."),
    ).toBeInTheDocument();
  });
});
