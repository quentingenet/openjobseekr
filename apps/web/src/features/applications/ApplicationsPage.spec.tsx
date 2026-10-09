import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { ApplicationList, ApplicationSummary } from '../../api/types';
import { type FetchStub, mockApi, problem, requestedUrls } from '../../test/api-mock';
import { jsonResponse, renderWithProviders } from '../../test/render';
import { mockMobileViewport } from '../../test/viewport';
import { ApplicationsPage } from './ApplicationsPage';
import { UNDO_WINDOW_MS } from './FollowUpActionsProvider';

/** A follow-up due. */
const due: ApplicationSummary = {
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
  followUpCount: 0,
  workMode: 'HYBRID',
  remoteRhythm: null,
  salaryRange: null,
  cvVersion: null,
  stack: null,
  recruitmentProcess: null,
  notes: null,
  createdAt: '2026-10-01T09:00:00.000Z',
  updatedAt: '2026-10-01T09:00:00.000Z',
};

const list: ApplicationList = {
  items: [due],
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
    // Short header: the table fits without scrolling sideways.
    expect(screen.getByRole('columnheader', { name: 'Mode' })).toBeInTheDocument();
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

  it('offers to export the applications next to the import', async () => {
    await renderWithProviders(<ApplicationsPage />, { path: '/applications', language: 'fr' });

    await userEvent.click(await screen.findByRole('button', { name: 'Exporter' }));

    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Excel (.xlsx)',
      'OpenDocument (.ods)',
    ]);
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
          keptFollowUpDates: 4,
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
        'Candidatures importées : 12 · Compétences ajoutées : 2 · Compétences déjà présentes : 1 · Dates de relance conservées : 4',
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(requests.map((request) => `${request.method} ${request.url}`)).toEqual([
      'GET /api/applications?order=desc&limit=20&offset=0',
      'POST /api/import',
      'GET /api/applications?order=desc&limit=20&offset=0',
    ]);
  });

  describe('recording a follow-up', () => {
    const followUpUrl = `/api/applications/${due.id}/follow-ups`;
    const recorded = { ...due, followUpDate: '2026-10-16', followUpOverride: '2026-10-16' };

    it('records it from the row without opening the application, and can undo it', async () => {
      const { requests } = mockApi({
        'GET /api/applications': { body: list },
        [`POST ${followUpUrl}`]: {
          body: { ...recorded, followUpOverdue: false, followUpCount: 1 },
        },
        [`PATCH /api/applications/${due.id}`]: { body: due },
      });
      const { router } = await renderWithProviders(<ApplicationsPage />, {
        path: '/applications',
        language: 'fr',
      });
      const row = (await screen.findByText('Acme')).closest('tr') as HTMLElement;

      await userEvent.click(within(row).getByRole('button', { name: "J'ai relancé" }));

      expect(
        await screen.findByText('Relance notée. Prochaine relance le 16 oct. 2026.'),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/applications');
      await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));

      await waitFor(() =>
        expect(requests.filter((r) => r.method !== 'GET')).toEqual([
          { method: 'POST', url: followUpUrl, body: undefined },
          {
            method: 'PATCH',
            url: `/api/applications/${due.id}`,
            body: { followUpOverride: null, followUpCount: 0 },
          },
        ]),
      );
      // The list is reloaded after each change.
      await waitFor(() => expect(requests.filter((r) => r.method === 'GET')).toHaveLength(3));
    });

    /** The API as a stateful server: following up and undoing change what the list returns. */
    function mockFollowUpApi() {
      let current = due;
      return mockApi({
        'GET /api/applications': () => jsonResponse({ ...list, items: [current] }),
        [`POST ${followUpUrl}`]: () => {
          current = { ...recorded, followUpOverdue: false, followUpCount: 1 };
          return jsonResponse(current);
        },
        [`PATCH /api/applications/${due.id}`]: () => {
          current = due;
          return jsonResponse(due);
        },
      });
    }

    it('turns the same button into an undo, kept in the row after the list reloads', async () => {
      const { requests } = mockFollowUpApi();
      await renderWithProviders(<ApplicationsPage />, { path: '/applications', language: 'fr' });
      const row = (await screen.findByText('Acme')).closest('tr') as HTMLElement;

      await userEvent.click(within(row).getByRole('button', { name: "J'ai relancé" }));

      // Reloaded: no longer due, yet the row still offers to undo.
      expect(await within(row).findByText('2e relance')).toBeInTheDocument();
      await userEvent.click(within(row).getByRole('button', { name: 'Annuler la relance' }));

      expect(await within(row).findByRole('button', { name: "J'ai relancé" })).toBeInTheDocument();
      expect(within(row).queryByText('2e relance')).not.toBeInTheDocument();
      expect(requests.filter((r) => r.method === 'PATCH')).toEqual([
        {
          method: 'PATCH',
          url: `/api/applications/${due.id}`,
          body: { followUpOverride: null, followUpCount: 0 },
        },
      ]);
    });

    it('never opens the application on a click around the button, even while it is busy', async () => {
      mockFollowUpApi();
      const { router } = await renderWithProviders(<ApplicationsPage />, {
        path: '/applications',
        language: 'en',
      });
      const row = (await screen.findByText('Acme')).closest('tr') as HTMLElement;

      await userEvent.click(within(row).getByRole('button', { name: 'I followed up' }));
      const undo = await within(row).findByRole('button', { name: 'Undo follow-up' });
      // A disabled button lets clicks through to its wrapper (the ring around the icon, or a
      // second click while the undo is sent): the row must not get them either.
      await userEvent.click(undo.parentElement as HTMLElement);
      await userEvent.click(undo);
      await userEvent.click(undo.parentElement as HTMLElement);

      expect(router.state.location.pathname).toBe('/applications');
    });

    it('undoes once only, even when the notification is clicked while the undo is sent', async () => {
      let answerUndo: () => void = () => undefined;
      const { requests } = mockApi({
        'GET /api/applications': { body: list },
        [`POST ${followUpUrl}`]: {
          body: { ...recorded, followUpOverdue: false, followUpCount: 1 },
        },
        [`PATCH /api/applications/${due.id}`]: () =>
          new Promise<Response>((resolve) => {
            answerUndo = () => resolve(jsonResponse(due));
          }),
      });
      await renderWithProviders(<ApplicationsPage />, { path: '/applications', language: 'en' });
      const row = (await screen.findByText('Acme')).closest('tr') as HTMLElement;
      await userEvent.click(within(row).getByRole('button', { name: 'I followed up' }));

      await userEvent.click(await within(row).findByRole('button', { name: 'Undo follow-up' }));
      await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
      answerUndo();

      await waitFor(() =>
        expect(within(row).queryByRole('button', { name: 'Undo follow-up' })).toBeNull(),
      );
      expect(requests.filter((r) => r.method === 'PATCH')).toHaveLength(1);
    });

    it('reports a failed undo', async () => {
      mockApi({
        'GET /api/applications': { body: list },
        [`POST ${followUpUrl}`]: {
          body: { ...recorded, followUpOverdue: false, followUpCount: 1 },
        },
        [`PATCH /api/applications/${due.id}`]: {
          status: 503,
          body: problem(503, 'SERVICE_UNAVAILABLE'),
        },
      });
      await renderWithProviders(<ApplicationsPage />, { path: '/applications', language: 'en' });
      await screen.findByText('Acme');
      await userEvent.click(screen.getByRole('button', { name: 'I followed up' }));

      await userEvent.click(await screen.findByRole('button', { name: 'Undo' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'The service is temporarily unavailable.',
      );
      expect(screen.queryByRole('button', { name: 'Undo follow-up' })).toBeNull();
    });

    it('keeps the follow-up once the undo window is over', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
      try {
        const { requests } = mockFollowUpApi();
        await renderWithProviders(<ApplicationsPage />, { path: '/applications', language: 'en' });
        const row = (await screen.findByText('Acme')).closest('tr') as HTMLElement;

        await user.click(within(row).getByRole('button', { name: 'I followed up' }));
        await within(row).findByText('Follow-up #2');
        expect(within(row).getByRole('button', { name: 'Undo follow-up' })).toBeInTheDocument();

        await act(() => vi.advanceTimersByTimeAsync(UNDO_WINDOW_MS));

        await waitFor(() =>
          expect(within(row).queryByRole('button', { name: 'Undo follow-up' })).toBeNull(),
        );
        expect(within(row).queryByRole('button', { name: 'I followed up' })).toBeNull();
        expect(within(row).getByText('Follow-up #2')).toBeInTheDocument();
        expect(requests.filter((r) => r.method === 'PATCH')).toEqual([]);
      } finally {
        vi.useRealTimers();
      }
    });

    it('shows the rank of the next follow-up once the user has followed up', async () => {
      mockApi({
        'GET /api/applications': {
          body: { ...list, items: [{ ...due, followUpDate: '2026-10-16', followUpCount: 1 }] },
        },
      });
      await renderWithProviders(<ApplicationsPage />, { path: '/applications', language: 'fr' });

      const row = (await screen.findByText('Acme')).closest('tr') as HTMLElement;
      expect(within(row).getByText('2e relance')).toBeInTheDocument();
    });

    it('shows no rank before the first follow-up', async () => {
      mockApi({ 'GET /api/applications': { body: list } });
      await renderWithProviders(<ApplicationsPage />, { path: '/applications', language: 'fr' });
      await screen.findByText('Acme');

      expect(screen.queryByText(/relance$/)).not.toBeInTheDocument();
    });

    it('is offered only for a follow-up due', async () => {
      mockApi({
        'GET /api/applications': {
          body: {
            ...list,
            items: [{ ...due, followUpDate: '2026-10-20', followUpOverdue: false }],
          },
        },
      });
      await renderWithProviders(<ApplicationsPage />, { path: '/applications', language: 'en' });
      await screen.findByText('Acme');

      expect(screen.queryByRole('button', { name: 'I followed up' })).not.toBeInTheDocument();
    });

    it('shows a translated error when the application no longer waits for an answer', async () => {
      mockApi({
        'GET /api/applications': { body: list },
        [`POST ${followUpUrl}`]: { status: 409, body: problem(409, 'FOLLOW_UP_NOT_EXPECTED') },
      });
      await renderWithProviders(<ApplicationsPage />, { path: '/applications', language: 'en' });
      await screen.findByText('Acme');

      await userEvent.click(screen.getByRole('button', { name: 'I followed up' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'This application is no longer waiting for an answer: no follow-up is expected.',
      );
    });
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

    it('offers to record a follow-up due beside the card link', async () => {
      let current = due;
      const { requests } = mockApi({
        'GET /api/applications': () => jsonResponse({ ...list, items: [current] }),
        [`POST /api/applications/${due.id}/follow-ups`]: () => {
          current = {
            ...due,
            followUpDate: '2026-10-16',
            followUpOverdue: false,
            followUpCount: 1,
          };
          return jsonResponse(current);
        },
      });
      const { router } = await renderWithProviders(<ApplicationsPage />, {
        path: '/applications',
        language: 'en',
      });
      const card = (await screen.findByText('Acme')).closest('a') as HTMLElement;
      const button = screen.getByRole('button', { name: 'I followed up' });
      expect(card).not.toContainElement(button);

      await userEvent.click(button);

      expect(
        await screen.findByText('Follow-up recorded. Next one on Oct 16, 2026.'),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/applications');
      expect(requests.filter((r) => r.method === 'POST')).toHaveLength(1);
      // Reloaded: the follow-up is no longer due and the card shows the next one's rank.
      expect(await within(card).findByText('Follow-up #2')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'I followed up' })).not.toBeInTheDocument();
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
