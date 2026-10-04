import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { tokenStorage } from '../../api/token-storage';
import { handleQueryError } from '../../api/query-client';
import { ApiError } from '../../api/client';
import { AppProviders } from '../../components/AppProviders';
import { RedirectIfAuthenticated, RequireAuth } from '../../components/RequireAuth';
import i18n from '../../i18n';
import { mockApi, problem } from '../../test/api-mock';
import { AuthPage } from './AuthPage';

async function renderApp(url: string, language: 'en' | 'fr' = 'en') {
  await i18n.changeLanguage(language);
  const router = createMemoryRouter(
    [
      {
        element: <RedirectIfAuthenticated />,
        children: [{ path: '/login', element: <AuthPage mode="login" /> }],
      },
      {
        element: <RequireAuth />,
        children: [{ path: '/stats', element: <h1>Stats page</h1> }],
      },
      { path: '/applications', element: <h1>Applications page</h1> },
    ],
    { initialEntries: [url] },
  );
  render(
    <AppProviders queryClient={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return router;
}

describe('authentication flow', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends a visitor to the login page, then back to the requested page', async () => {
    const { requests } = mockApi({
      'POST /api/auth/login': { body: { accessToken: 'token-1', user: {} } },
    });
    const router = await renderApp('/stats?x=1');

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/Email/), '  Jane@Example.com ');
    await userEvent.type(screen.getByLabelText(/Password/), 'correct horse');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('heading', { name: 'Stats page' })).toBeInTheDocument();
    expect(router.state.location.pathname + router.state.location.search).toBe('/stats?x=1');
    expect(requests[0]?.body).toEqual({ email: 'jane@example.com', password: 'correct horse' });
    expect(tokenStorage.get()).toBe('token-1');
  });

  it('shows the translated API error on wrong credentials', async () => {
    mockApi({
      'POST /api/auth/login': {
        status: 401,
        body: problem(401, 'INVALID_CREDENTIALS'),
      },
    });
    await renderApp('/login', 'fr');

    await userEvent.type(screen.getByLabelText(/Email/), 'jane@example.com');
    await userEvent.type(screen.getByLabelText(/Mot de passe/), 'wrong password');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByText('Email ou mot de passe incorrect.')).toBeInTheDocument();
    expect(tokenStorage.get()).toBeNull();
  });

  it('validates the form before calling the API', async () => {
    const { fetchMock } = mockApi({});
    await renderApp('/login');

    await userEvent.type(screen.getByLabelText(/Email/), 'not-an-email');
    await userEvent.type(screen.getByLabelText(/Password/), 'short');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('8 characters minimum')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('logs out on an expired session and returns to login, remembering the page', async () => {
    tokenStorage.set('expired-token');
    const router = await renderApp('/stats');
    expect(await screen.findByRole('heading', { name: 'Stats page' })).toBeInTheDocument();

    handleQueryError(new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired token'));

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(router.state.location.state).toEqual({ from: '/stats' });
    expect(tokenStorage.get()).toBeNull();
  });

  it('sends a logged-in user away from the login page', async () => {
    tokenStorage.set('token-1');
    const router = await renderApp('/login');

    await waitFor(() => expect(router.state.location.pathname).toBe('/applications'));
  });
});
