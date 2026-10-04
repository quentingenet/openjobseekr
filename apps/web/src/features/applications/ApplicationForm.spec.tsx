import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/client';
import { renderWithProviders } from '../../test/render';
import { emptyApplicationForm } from './application-form.schema';
import { ApplicationForm, type ApplicationFormOutput } from './ApplicationForm';

function renderForm(language: 'en' | 'fr', onSubmit = vi.fn().mockResolvedValue(undefined)) {
  return renderWithProviders(
    <ApplicationForm
      defaultValues={emptyApplicationForm('2026-10-01')}
      followUpDelayDays={7}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
    />,
    { language },
  );
}

describe('ApplicationForm', () => {
  it('shows the validation messages in English', async () => {
    const onSubmit = vi.fn();
    await renderForm('en', onSubmit);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findAllByText('This field is required')).toHaveLength(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the validation messages in French', async () => {
    await renderForm('fr');

    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findAllByText('Ce champ est obligatoire')).toHaveLength(2);
    expect(screen.getByRole('textbox', { name: /Entreprise/ })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('shows the max length message with the limit', async () => {
    await renderForm('en');
    const company = screen.getByRole('textbox', { name: /Company/ });

    // The input caps typing at the limit; pasting a longer value is still validated.
    company.removeAttribute('maxlength');
    await userEvent.click(company);
    await userEvent.paste('a'.repeat(201));
    await userEvent.tab();

    expect(await screen.findByText('200 characters maximum')).toBeInTheDocument();
  });

  it('submits trimmed values', async () => {
    const onSubmit = vi.fn<(values: ApplicationFormOutput) => Promise<void>>().mockResolvedValue();
    await renderForm('en', onSubmit);

    await userEvent.type(screen.getByRole('textbox', { name: /Company/ }), '  Acme  ');
    await userEvent.type(screen.getByRole('textbox', { name: /Job title/ }), 'Backend developer');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const values = onSubmit.mock.calls[0]?.[0];
    expect(values).toMatchObject({
      sentAt: '2026-10-01',
      company: 'Acme',
      jobTitle: 'Backend developer',
      status: 'SENT',
      channel: '',
    });
  });

  it('shows API field errors under the field and the error banner', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(
        new ApiError(400, 'VALIDATION_FAILED', 'Request validation failed', [
          { field: 'jobTitle', constraints: ['maxLength'] },
        ]),
      );
    await renderForm('fr', onSubmit);

    await userEvent.type(screen.getByRole('textbox', { name: /Entreprise/ }), 'Acme');
    await userEvent.type(screen.getByRole('textbox', { name: /Intitulé du poste/ }), 'Dev');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Certains champs sont invalides.')).toBeInTheDocument();
    expect(screen.getByText('200 caractères maximum')).toBeInTheDocument();
  });

  it('previews the follow-up date while the status is SENT', async () => {
    await renderForm('en');

    expect(screen.getByRole('status')).toHaveTextContent('Follow-up planned on Oct 8, 2026');
  });
});
