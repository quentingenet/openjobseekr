import { render, screen } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import i18n from '../i18n';
import { AppProviders } from './AppProviders';
import { RouteErrorPage } from './RouteErrorPage';

function Crash(): never {
  throw new Error('render failure');
}

describe('RouteErrorPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('replaces a crashed page with a translated message and a way back', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await i18n.changeLanguage('fr');
    const router = createMemoryRouter([
      { path: '/', element: <Crash />, errorElement: <RouteErrorPage /> },
    ]);
    render(
      <AppProviders queryClient={new QueryClient()}>
        <RouterProvider router={router} />
      </AppProviders>,
    );

    expect(
      await screen.findByText("Un problème est survenu à l'affichage de cette page."),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Aller à mes candidatures' })).toHaveAttribute(
      'href',
      '/applications',
    );
  });
});
