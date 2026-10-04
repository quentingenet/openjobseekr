import { render } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppProviders } from '../components/AppProviders';
import i18n, { type Language } from '../i18n';

interface RenderOptions {
  /** Route pattern the element is mounted on (e.g. '/applications/:id'). */
  path?: string;
  url?: string;
  language?: Language;
}

/** Renders an element with the real providers and a data router (needed by `useBlocker`). */
export async function renderWithProviders(element: ReactElement, options: RenderOptions = {}) {
  const { path = '/', url = path, language = 'en' } = options;
  await i18n.changeLanguage(language);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      { path, element },
      { path: '*', element: <p>other page</p> },
    ],
    { initialEntries: [url] },
  );
  const result = render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...result, router, queryClient };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
