import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockApi } from '../../test/api-mock';
import { APPLICATION_ID, application } from '../../test/fixtures';
import { renderWithProviders } from '../../test/render';
import { ApplicationDetailPage } from './ApplicationDetailPage';

const detailUrl = `/api/applications/${APPLICATION_ID}`;

describe('ApplicationDetailPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows every field, translated, and the job posting as plain text', async () => {
    mockApi({
      [`GET ${detailUrl}`]: { body: { ...application, jobPostingText: '<b>We are hiring</b>' } },
    });
    await renderWithProviders(<ApplicationDetailPage />, {
      path: '/applications/:id',
      url: `/applications/${APPLICATION_ID}`,
      language: 'fr',
    });

    expect(await screen.findByRole('heading', { name: 'Acme' })).toBeInTheDocument();
    expect(screen.getByText('Backend developer')).toBeInTheDocument();
    expect(screen.getByText('Envoyée')).toBeInTheDocument();
    expect(screen.getByText('Relance en retard depuis le 8 oct. 2026')).toBeInTheDocument();
    expect(screen.getByText('Hybride')).toBeInTheDocument();
    expect(screen.getByText('Marie Martin')).toBeInTheDocument();
    // HTML in user data is displayed, never interpreted.
    expect(screen.getByText('<b>We are hiring</b>')).toBeInTheDocument();
    expect(document.querySelector('b')).toBeNull();
  });

  it('deletes after confirmation and goes back to the list without showing an error', async () => {
    const { requests } = mockApi({
      [`GET ${detailUrl}`]: { body: application },
      [`DELETE ${detailUrl}`]: { status: 204 },
    });
    const { router } = await renderWithProviders(<ApplicationDetailPage />, {
      path: '/applications/:id',
      url: `/applications/${APPLICATION_ID}`,
      language: 'en',
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    expect(
      screen.getByText('The application to Acme will be permanently deleted.'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/applications'));
    expect(requests.filter((r) => r.method === 'DELETE')).toHaveLength(1);
    // The deleted detail was not refetched.
    expect(requests.filter((r) => r.method === 'GET' && r.url === detailUrl)).toHaveLength(1);
    expect(screen.queryByText('This application does not exist or was deleted.')).toBeNull();
  });

  it('shows a translated error for an unknown application', async () => {
    mockApi({
      [`GET ${detailUrl}`]: {
        status: 404,
        body: { code: 'APPLICATION_NOT_FOUND', message: 'Application not found' },
      },
    });
    await renderWithProviders(<ApplicationDetailPage />, {
      path: '/applications/:id',
      url: `/applications/${APPLICATION_ID}`,
      language: 'fr',
    });

    expect(
      await screen.findByText("Cette candidature n'existe pas ou a été supprimée."),
    ).toBeInTheDocument();
  });
});
