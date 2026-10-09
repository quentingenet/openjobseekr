import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockApi, problem } from '../../test/api-mock';
import { APPLICATION_ID, application } from '../../test/fixtures';
import { jsonResponse, renderWithProviders } from '../../test/render';
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

  it('records a follow-up, even before it is due, and shows the next one', async () => {
    const notDue = { ...application, followUpDate: '2026-10-20', followUpOverdue: false };
    const afterFollowUp = { ...notDue, followUpDate: '2026-10-16', followUpCount: 1 };
    let recorded = false;
    const { requests } = mockApi({
      [`GET ${detailUrl}`]: () => jsonResponse(recorded ? afterFollowUp : notDue),
      [`POST ${detailUrl}/follow-ups`]: () => {
        recorded = true;
        return jsonResponse(afterFollowUp);
      },
    });
    await renderWithProviders(<ApplicationDetailPage />, {
      path: '/applications/:id',
      url: `/applications/${APPLICATION_ID}`,
      language: 'en',
    });
    expect(await screen.findByText('Follow-up: Oct 20, 2026')).toBeInTheDocument();
    expect(screen.queryByText('Follow-up #2')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'I followed up' }));

    expect(await screen.findByText('Follow-up: Oct 16, 2026')).toBeInTheDocument();
    expect(screen.getByText('Follow-up #2')).toBeInTheDocument();
    expect(screen.getByText('Follow-up recorded. Next one on Oct 16, 2026.')).toBeInTheDocument();
    expect(requests.filter((r) => r.method === 'POST')).toHaveLength(1);
    // The same button now undoes it, with the seconds left.
    expect(screen.getByRole('button', { name: 'Undo follow-up' })).toHaveTextContent(
      /^Undo \(\d+ s\)$/,
    );
  });

  it('offers no follow-up once an answer is received', async () => {
    mockApi({
      [`GET ${detailUrl}`]: {
        body: { ...application, status: 'REJECTED', followUpDate: null, followUpOverdue: false },
      },
    });
    await renderWithProviders(<ApplicationDetailPage />, {
      path: '/applications/:id',
      url: `/applications/${APPLICATION_ID}`,
      language: 'en',
    });
    await screen.findByRole('heading', { name: 'Acme' });

    expect(screen.queryByRole('button', { name: 'I followed up' })).not.toBeInTheDocument();
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
        body: problem(404, 'APPLICATION_NOT_FOUND'),
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
