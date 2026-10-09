import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test/render';
import { mockMobileViewport } from '../test/viewport';
import { AppLayout } from './AppLayout';

describe('AppLayout', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the navigation links in the app bar on a desktop screen', async () => {
    await renderWithProviders(<AppLayout />, { path: '/applications', language: 'en' });

    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(nav).getByRole('link', { name: 'Statistics' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open the menu' })).not.toBeInTheDocument();
  });

  it('gives the pages the full width, capped on very large screens', async () => {
    await renderWithProviders(<AppLayout />, { path: '/applications', language: 'en' });

    // Wide tables fit without scrolling sideways; lines stay readable on a 4K screen.
    expect(screen.getByRole('main')).toHaveClass('MuiContainer-maxWidthXl');
  });

  it('moves the navigation into a menu on a phone, closed after choosing a page', async () => {
    mockMobileViewport();
    const { router } = await renderWithProviders(<AppLayout />, {
      path: '/applications',
      language: 'fr',
    });

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    const menuButton = screen.getByRole('button', { name: 'Ouvrir le menu' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(menuButton);

    const nav = screen.getByRole('navigation', { name: 'Navigation principale' });
    expect(within(nav).getByRole('link', { name: 'Candidatures' })).toHaveClass('active');
    expect(screen.getByRole('group', { name: 'Langue' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Se déconnecter' })).toBeInTheDocument();

    await userEvent.click(within(nav).getByRole('link', { name: 'Statistiques' }));

    expect(router.state.location.pathname).toBe('/stats');
    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument());
  });
});
