import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTranslation } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../test/render';
import { LanguageSwitcher } from './LanguageSwitcher';

function Page() {
  const { t } = useTranslation();
  return (
    <>
      <LanguageSwitcher />
      <h1>{t('applications.title')}</h1>
    </>
  );
}

describe('LanguageSwitcher', () => {
  it('switches the displayed text, <html lang> and remembers the choice', async () => {
    await renderWithProviders(<Page />, { language: 'en' });
    expect(screen.getByRole('heading')).toHaveTextContent('Applications');

    await userEvent.click(screen.getByRole('button', { name: 'Français' }));

    expect(screen.getByRole('heading')).toHaveTextContent('Candidatures');
    expect(document.documentElement.lang).toBe('fr');
    expect(localStorage.getItem('openjobseekr.language')).toBe('fr');

    await userEvent.click(screen.getByRole('button', { name: 'Español' }));

    expect(screen.getByRole('heading')).toHaveTextContent('Candidaturas');
    expect(document.documentElement.lang).toBe('es');

    await userEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(screen.getByRole('heading')).toHaveTextContent('Applications');
    expect(document.documentElement.lang).toBe('en');
  });
});
