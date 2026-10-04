import { APPLICATION_CHANNELS, APPLICATION_STATUSES } from '@openjobseekr/domain';
import { QueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tokenStorage } from './api/token-storage';
import { AppProviders } from './components/AppProviders';
import i18n from './i18n';
import { routes } from './routes';
import { mockApi } from './test/api-mock';

async function renderRoutes(url: string) {
  await i18n.changeLanguage('en');
  const router = createMemoryRouter(routes, { initialEntries: [url] });
  render(
    <AppProviders queryClient={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return router;
}

// A lazy page is a dynamic import: on a cold cache (fresh clone), transforming its modules
// takes longer than the default 1 s wait of findBy* queries.
const LAZY_PAGE = { timeout: 10_000 };

const zeros = (codes: readonly string[]) => Object.fromEntries(codes.map((code) => [code, 0]));

describe('routes', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends a visitor to the login page, loaded on demand', async () => {
    const router = await renderRoutes('/stats');

    expect(await screen.findByRole('heading', { name: 'Log in' }, LAZY_PAGE)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('loads a page of the app on demand once logged in', async () => {
    tokenStorage.set('token-1');
    mockApi({
      'GET /api/stats/overview': {
        body: {
          total: 0,
          byStatus: zeros(APPLICATION_STATUSES),
          byChannel: zeros([...APPLICATION_CHANNELS, 'UNSPECIFIED']),
          responseRate: null,
        },
      },
    });

    await renderRoutes('/stats');

    expect(
      await screen.findByRole('heading', { name: 'Statistics' }, LAZY_PAGE),
    ).toBeInTheDocument();
  });
});
