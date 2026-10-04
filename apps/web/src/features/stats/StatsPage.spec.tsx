import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockApi } from '../../test/api-mock';
import { renderWithProviders } from '../../test/render';
import { StatsPage } from './StatsPage';

const zero = {
  SENT: 0,
  RESPONSE_RECEIVED: 0,
  HR_INTERVIEW: 0,
  TECHNICAL_INTERVIEW: 0,
  OFFER: 0,
  REJECTED: 0,
  NO_RESPONSE: 0,
};

describe('StatsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the total, the response rate and the breakdowns, in French', async () => {
    mockApi({
      'GET /api/stats/overview': {
        body: {
          total: 5,
          byStatus: { ...zero, SENT: 2, HR_INTERVIEW: 1, REJECTED: 1, NO_RESPONSE: 1 },
          byChannel: { LINKEDIN: 2, APEC: 2, UNSPECIFIED: 1 },
          responseRate: 0.4,
        },
      },
    });
    await renderWithProviders(<StatsPage />, { path: '/stats', language: 'fr' });

    // Testing Library normalizes the no-break space before % to a regular space.
    const rate = (await screen.findByText('Taux de réponse')).parentElement as HTMLElement;
    expect(within(rate).getByText('40 %')).toBeInTheDocument();
    const total = screen.getByText('Candidatures').parentElement as HTMLElement;
    expect(within(total).getByText('5')).toBeInTheDocument();
    const sentRow = screen.getByText('Envoyée').closest('tr') as HTMLElement;
    expect(within(sentRow).getByText('2')).toBeInTheDocument();
    const unspecifiedRow = screen.getByText('Non renseigné').closest('tr') as HTMLElement;
    expect(within(unspecifiedRow).getByText('20 %')).toBeInTheDocument();
  });

  it('shows a dash and a hint without applications', async () => {
    mockApi({
      'GET /api/stats/overview': {
        body: { total: 0, byStatus: zero, byChannel: {}, responseRate: null },
      },
    });
    await renderWithProviders(<StatsPage />, { path: '/stats', language: 'en' });

    expect(await screen.findByText('Add applications to see statistics.')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
