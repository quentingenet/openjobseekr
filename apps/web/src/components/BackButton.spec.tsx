import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import i18n from '../i18n';
import { AppProviders } from './AppProviders';
import { BackButton } from './BackButton';

async function renderAt(
  entries: string[],
  { fallback }: { fallback?: string } = { fallback: '/applications' },
) {
  await i18n.changeLanguage('fr');
  const router = createMemoryRouter(
    [
      { path: '/applications/new', element: <BackButton fallback={fallback} /> },
      { path: '*', element: <p>autre page</p> },
    ],
    { initialEntries: entries, initialIndex: entries.length - 1 },
  );
  render(
    <AppProviders queryClient={new QueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return router;
}

describe('BackButton', () => {
  it('returns to the previous page', async () => {
    const router = await renderAt(['/stats', '/applications/new']);
    // Entries given to a memory router do not count as navigations: go through one.
    await router.navigate('/applications/new?from=stats');

    await userEvent.click(screen.getByRole('button', { name: 'Retour' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/applications/new'));
    await userEvent.click(screen.getByRole('button', { name: 'Retour' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/stats'));
  });

  it('goes to the fallback when the page was opened directly', async () => {
    const router = await renderAt(['/applications/new']);

    await userEvent.click(screen.getByRole('button', { name: 'Retour' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/applications'));
  });

  it('is hidden on a page opened directly that has no fallback (e.g. the home list)', async () => {
    await renderAt(['/applications/new'], {});

    expect(screen.queryByRole('button', { name: 'Retour' })).toBeNull();
  });
});
