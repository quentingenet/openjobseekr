import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { ApplicationList } from '../../api/types';
import { type FetchStub, mockApi, requestedUrls } from '../../test/api-mock';
import { jsonResponse, renderWithProviders } from '../../test/render';
import { mockMobileViewport } from '../../test/viewport';
import { ApplicationsPage } from './ApplicationsPage';

const list: ApplicationList = {
  items: [
    {
      id: '6c3f4d2e-0000-4000-8000-000000000001',
      sentAt: '2026-10-01',
      company: 'Acme',
      jobTitle: 'Backend developer',
      location: null,
      response: null,
      resources: null,
      channel: 'LINKEDIN',
      channelDetail: null,
      status: 'SENT',
      contact: null,
      followUpDate: '2026-10-08',
      followUpOverride: null,
      followUpOverdue: true,
      workMode: 'HYBRID',
      remoteRhythm: null,
      salaryRange: null,
      cvVersion: null,
      stack: null,
      recruitmentProcess: null,
      notes: null,
      createdAt: '2026-10-01T09:00:00.000Z',
      updatedAt: '2026-10-01T09:00:00.000Z',
    },
  ],
  total: 1,
  limit: 20,
  offset: 0,
};

describe('ApplicationsPage', () => {
  let fetchMock: Mock<FetchStub>;

  beforeEach(() => {
    fetchMock = vi.fn<FetchStub>().mockImplementation(() => Promise.resolve(jsonResponse(list)));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the applications in the table, translated', async () => {
    await renderWithProviders(<ApplicationsPage />, { path: '/applications', language: 'fr' });

    const row = (await screen.findByText('Acme')).closest('tr');
    expect(row).not.toBeNull();
    const cells = within(row as HTMLElement);
    expect(cells.getByText('1 oct. 2026')).toBeInTheDocument();
    expect(cells.getByText('LinkedIn')).toBeInTheDocument();
    expect(cells.getByText('Envoyée')).toBeInTheDocument();
    expect(cells.getByText('Hybride')).toBeInTheDocument();
    expect(cells.getByText('8 oct. 2026')).toBeInTheDocument();
    expect(screen.getByText('1–1 sur 1')).toBeInTheDocument();
  });

  it('puts filters in the URL and sends them to the API', async () => {
    const { router } = await renderWithProviders(<ApplicationsPage />, {
      path: '/applications',
      language: 'en',
    });
    await screen.findByText('Acme');

    await userEvent.click(screen.getByRole('switch', { name: 'Follow-ups due' }));

    await waitFor(() => expect(router.state.location.search).toBe('?overdue=true'));
    await waitFor(() =>
      expect(requestedUrls(fetchMock).at(-1)).toBe(
        '/api/applications?overdue=true&order=desc&limit=20&offset=0',
      ),
    );
  });

  it('reads the filters from the URL', async () => {
    await renderWithProviders(<ApplicationsPage />, {
      path: '/applications',
      url: '/applications?status=REJECTED&q=acme&page=2&limit=10',
      language: 'en',
    });

    await waitFor(() =>
      expect(requestedUrls(fetchMock)).toContain(
        '/api/applications?status=REJECTED&q=acme&order=desc&limit=10&offset=20',
      ),
    );
  });

  it('shows an empty state with a way to clear filters', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(jsonResponse({ items: [], total: 0, limit: 20, offset: 0 })),
    );
    await renderWithProviders(<ApplicationsPage />, {
      path: '/applications',
      url: '/applications?status=OFFER',
      language: 'en',
    });

    expect(await screen.findByText('No applications match these filters.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });

  it('shows a translated error when the API is down', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await renderWithProviders(<ApplicationsPage />, { path: '/applications', language: 'fr' });

    expect(
      await screen.findByText("Le serveur est injoignable. L'API est-elle lancée ?"),
    ).toBeInTheDocument();
  });

  it('changes page and page size through the URL', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(jsonResponse({ ...list, total: 45, items: list.items })),
    );
    const { router } = await renderWithProviders(<ApplicationsPage />, {
      path: '/applications',
      language: 'en',
    });
    await screen.findByText('1–20 of 45');

    await userEvent.click(screen.getByRole('button', { name: 'Go to next page' }));

    await waitFor(() => expect(router.state.location.search).toBe('?page=1'));
    await waitFor(() =>
      expect(requestedUrls(fetchMock).at(-1)).toBe(
        '/api/applications?order=desc&limit=20&offset=20',
      ),
    );
  });

  it('goes back to the last page when the current one is past the end', async () => {
    fetchMock.mockImplementation((request: Request) =>
      Promise.resolve(
        jsonResponse({
          ...list,
          total: 3,
          items: request.url.includes('offset=40') ? [] : list.items,
        }),
      ),
    );
    const { router } = await renderWithProviders(<ApplicationsPage />, {
      path: '/applications',
      url: '/applications?page=2',
      language: 'en',
    });

    await waitFor(() => expect(router.state.location.search).toBe(''));
  });

  it('searches after a pause in typing, without losing a filter changed meanwhile', async () => {
    const { router } = await renderWithProviders(<ApplicationsPage />, {
      path: '/applications',
      language: 'en',
    });
    await screen.findByText('Acme');

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Search company or job title' }),
      'acme',
    );
    await userEvent.click(screen.getByRole('switch', { name: 'Follow-ups due' }));

    await waitFor(() => expect(router.state.location.search).toBe('?overdue=true&q=acme'));
  });

  it('empties the search box when the URL loses the search', async () => {
    const { router } = await renderWithProviders(<ApplicationsPage />, {
      path: '/applications',
      url: '/applications?q=acme',
      language: 'en',
    });
    const searchBox = screen.getByRole('textbox', { name: 'Search company or job title' });
    expect(searchBox).toHaveValue('acme');

    await router.navigate('/applications');

    await waitFor(() => expect(searchBox).toHaveValue(''));
  });

  it('sorts by sent date when clicking the column header, newest first by default', async () => {
    const { router } = await renderWithProviders(<ApplicationsPage />, {
      path: '/applications',
      url: '/applications?page=1',
      language: 'fr',
    });
    const header = await screen.findByRole('columnheader', { name: /Envoyée le/ });
    expect(header).toHaveAttribute('aria-sort', 'descending');

    await userEvent.click(within(header).getByRole('button'));

    await waitFor(() => expect(router.state.location.search).toBe('?order=asc'));
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    expect(header).toHaveTextContent('triées de la plus ancienne à la plus récente');
    await waitFor(() =>
      expect(requestedUrls(fetchMock).at(-1)).toBe('/api/applications?order=asc&limit=20&offset=0'),
    );

    await userEvent.click(within(header).getByRole('button'));

    await waitFor(() => expect(router.state.location.search).toBe(''));
    expect(header).toHaveAttribute('aria-sort', 'descending');
  });

  it('shows the precision of the OTHER channel', async () => {
    const [item] = list.items;
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        jsonResponse({ ...list, items: [{ ...item, channel: 'OTHER', channelDetail: 'Monster' }] }),
      ),
    );
    await renderWithProviders(<ApplicationsPage />, { path: '/applications', language: 'fr' });

    expect(await screen.findByText('Autre (Monster)')).toBeInTheDocument();
  });

  it('imports a spreadsheet after the warning, then reloads the list and reports the result', async () => {
    const user = userEvent.setup();
    const { requests } = mockApi({
      'GET /api/applications': { body: list },
      'POST /api/import': {
        body: {
          deletedApplications: 3,
          importedApplications: 12,
          addedSkills: 2,
          ignoredSkills: [{ row: 6, name: 'TYPESCRIPT', keptName: 'TypeScript' }],
        },
      },
    });
    await renderWithProviders(<ApplicationsPage />, { path: '/applications', language: 'fr' });
    await screen.findByText('Acme');

    await user.click(screen.getByRole('button', { name: 'Importer' }));
    const dialog = screen.getByRole('dialog', { name: 'Importer un fichier' });
    await user.upload(
      within(dialog).getByLabelText('Choisir un fichier'),
      new File([new Uint8Array(10)], 'suivi.ods'),
    );
    await user.click(within(dialog).getByRole('button', { name: 'OK, importer' }));

    expect(
      await screen.findByText(
        'Candidatures importées : 12 · Compétences ajoutées : 2 · Compétences déjà présentes : 1',
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(requests.map((request) => `${request.method} ${request.url}`)).toEqual([
      'GET /api/applications?order=desc&limit=20&offset=0',
      'POST /api/import',
      'GET /api/applications?order=desc&limit=20&offset=0',
    ]);
  });

  describe('on a phone', () => {
    beforeEach(() => {
      mockMobileViewport();
    });

    it('shows each application as a card linking to its detail', async () => {
      await renderWithProviders(<ApplicationsPage />, { path: '/applications', language: 'fr' });

      const card = (await screen.findByText('Acme')).closest('a');
      expect(card).toHaveAttribute('href', '/applications/6c3f4d2e-0000-4000-8000-000000000001');
      const content = within(card as HTMLElement);
      expect(content.getByText('Backend developer')).toBeInTheDocument();
      expect(content.getByText('Envoyée')).toBeInTheDocument();
      expect(content.getByText('Envoyée le 1 oct. 2026')).toBeInTheDocument();
      expect(content.getByText('LinkedIn')).toBeInTheDocument();
      expect(content.getByText('8 oct. 2026')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(screen.getByRole('list', { name: 'Liste des candidatures' })).toBeInTheDocument();
    });

    it('sorts by sent date with a button above the cards', async () => {
      const { router } = await renderWithProviders(<ApplicationsPage />, {
        path: '/applications',
        language: 'en',
      });
      await screen.findByText('Acme');

      await userEvent.click(screen.getByRole('button', { name: 'Newest first' }));

      await waitFor(() => expect(router.state.location.search).toBe('?order=asc'));
      await userEvent.click(screen.getByRole('button', { name: 'Oldest first' }));
      await waitFor(() => expect(router.state.location.search).toBe(''));
    });
  });
});
