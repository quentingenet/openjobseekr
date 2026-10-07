import { fireEvent, screen, waitFor, within } from '@testing-library/react';
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

/** The hidden input of the follow-up date picker, which holds the displayed date. */
const followUpInput = () =>
  document.querySelector<HTMLInputElement>('input[name="followUpOverride"]');
/** The visible field of the follow-up date picker, with its month, day and year sections. */
const followUpField = () => followUpInput()?.parentElement as HTMLElement;

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

  it('shows the computed follow-up date while the status is SENT', async () => {
    await renderForm('en');

    expect(followUpInput()).toHaveValue('10/08/2026');
    expect(screen.getByText('Computed: sent date + 7 days')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Use the computed date' })).toBeNull();
  });

  it('keeps a follow-up date picked by hand, but not the computed one', async () => {
    const onSubmit = vi.fn<(values: ApplicationFormOutput) => Promise<void>>().mockResolvedValue();
    await renderForm('en', onSubmit);
    await userEvent.type(screen.getByRole('textbox', { name: /Company/ }), 'Acme');
    await userEvent.type(screen.getByRole('textbox', { name: /Job title/ }), 'Dev');

    fireEvent.change(followUpInput() as HTMLInputElement, { target: { value: '10/20/2026' } });
    expect(await screen.findByText('Set by hand')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ followUpOverride: '2026-10-20' });

    fireEvent.change(followUpInput() as HTMLInputElement, { target: { value: '10/08/2026' } });
    expect(await screen.findByText('Computed: sent date + 7 days')).toBeInTheDocument();
  });

  it('flags an impossible follow-up date instead of replacing it', async () => {
    const onSubmit = vi.fn();
    await renderForm('en', onSubmit);
    await userEvent.type(screen.getByRole('textbox', { name: /Company/ }), 'Acme');
    await userEvent.type(screen.getByRole('textbox', { name: /Job title/ }), 'Dev');

    // Typed section by section, like a user: February 31st does not exist.
    const [month, day] = within(followUpField()).getAllByRole('spinbutton');
    await userEvent.click(month as HTMLElement);
    await userEvent.keyboard('02');
    await userEvent.click(day as HTMLElement);
    await userEvent.keyboard('31');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Enter a valid date')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('goes back to the computed follow-up date after one was set by hand', async () => {
    const onSubmit = vi.fn<(values: ApplicationFormOutput) => Promise<void>>().mockResolvedValue();
    await renderWithProviders(
      <ApplicationForm
        defaultValues={{
          ...emptyApplicationForm('2026-10-01'),
          company: 'Acme',
          jobTitle: 'Dev',
          followUpOverride: '2026-10-20',
        }}
        followUpDelayDays={7}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
      { language: 'fr' },
    );
    expect(followUpInput()).toHaveValue('20/10/2026');
    expect(screen.getByText('Choisie manuellement')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Revenir au calcul automatique' }));

    expect(followUpInput()).toHaveValue('08/10/2026');
    expect(screen.getByText("Calculée : date d'envoi + 7 jours")).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ followUpOverride: '' });
  });

  it('has no follow-up date once the application received an answer', async () => {
    await renderWithProviders(
      <ApplicationForm
        defaultValues={{ ...emptyApplicationForm('2026-10-01'), status: 'REJECTED' }}
        followUpDelayDays={7}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
      { language: 'en' },
    );

    expect(followUpInput()).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent(
      'No follow-up: the application already got an answer.',
    );
  });

  it('asks which channel only when "Other" is chosen', async () => {
    await renderForm('fr');
    expect(screen.queryByRole('textbox', { name: 'Quel canal ?' })).toBeNull();

    await userEvent.click(screen.getByRole('combobox', { name: /Canal/ }));
    await userEvent.click(screen.getByRole('option', { name: 'Autre' }));

    expect(screen.getByRole('textbox', { name: 'Quel canal ?' })).toBeInTheDocument();
  });
});
