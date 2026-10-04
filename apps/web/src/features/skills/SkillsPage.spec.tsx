import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SkillStats } from '../../api/types';
import { mockApi, problem } from '../../test/api-mock';
import { renderWithProviders } from '../../test/render';
import { mockMobileViewport } from '../../test/viewport';
import { SkillsPage } from './SkillsPage';

const stats: SkillStats = {
  postingsAnalyzed: 6,
  skills: [
    {
      id: 'a',
      name: 'TypeScript',
      pattern: '\\bTypeScript\\b',
      level: 4,
      postingCount: 6,
      frequency: 1,
    },
    { id: 'b', name: 'Java', pattern: '\\bJava\\b', level: null, postingCount: 0, frequency: 0 },
  ],
};

describe('SkillsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the skills in the API order (most frequent first), translated', async () => {
    mockApi({ 'GET /api/skills/stats': { body: stats } });
    await renderWithProviders(<SkillsPage />, { path: '/skills', language: 'fr' });

    expect(
      await screen.findByText('Fréquence de chaque compétence dans vos 6 annonces enregistrées.'),
    ).toBeInTheDocument();
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows.map((row) => within(row).getAllByRole('cell')[0]?.textContent)).toEqual([
      'TypeScript',
      'Java',
    ]);
    expect(within(rows[0] as HTMLElement).getByText('100 %')).toBeInTheDocument();
    expect(within(rows[0] as HTMLElement).getByRole('img', { name: /4/ })).toBeInTheDocument();
  });

  it('adds a skill through the dialog', async () => {
    const { requests } = mockApi({
      'GET /api/skills/stats': { body: stats },
      'POST /api/skills': {
        status: 201,
        body: { id: 'c', name: 'Rust', pattern: '\\bRust\\b', level: 1 },
      },
    });
    await renderWithProviders(<SkillsPage />, { path: '/skills', language: 'en' });

    await userEvent.click(await screen.findByRole('button', { name: 'Add a skill' }));
    const dialog = screen.getByRole('dialog', { name: 'New skill' });
    await userEvent.type(within(dialog).getByRole('textbox', { name: /Skill/ }), 'Rust');
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: /Search pattern/ }),
      '\\bRust\\b',
    );
    await userEvent.click(within(dialog).getByRole('combobox', { name: /Current level/ }));
    await userEvent.click(screen.getByRole('option', { name: '1' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(requests.find((request) => request.method === 'POST')?.body).toEqual({
      name: 'Rust',
      pattern: '\\bRust\\b',
      level: 1,
    });
  });

  it('shows the API error on a pattern valid in JavaScript but not in RE2', async () => {
    mockApi({
      'GET /api/skills/stats': { body: stats },
      'POST /api/skills': {
        status: 400,
        body: problem(400, 'VALIDATION_FAILED', [{ field: 'pattern', constraints: ['isRegex'] }]),
      },
    });
    await renderWithProviders(<SkillsPage />, { path: '/skills', language: 'fr' });

    await userEvent.click(await screen.findByRole('button', { name: 'Ajouter une compétence' }));
    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByRole('textbox', { name: /Compétence/ }), 'Lent');
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: /Terme recherché/ }),
      'a(?=b)',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer' }));

    expect(
      await within(dialog).findByText("Ce n'est pas une expression régulière valide"),
    ).toBeInTheDocument();
  });

  it('edits a skill with its current values and deletes after confirmation', async () => {
    const { requests } = mockApi({
      'GET /api/skills/stats': { body: stats },
      'PATCH /api/skills/a': { body: { ...stats.skills[0], level: 5 } },
      'DELETE /api/skills/b': { status: 204 },
    });
    await renderWithProviders(<SkillsPage />, { path: '/skills', language: 'en' });

    await userEvent.click(await screen.findByRole('button', { name: 'Edit TypeScript' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit skill' });
    expect(within(dialog).getByRole('textbox', { name: /Search pattern/ })).toHaveValue(
      '\\bTypeScript\\b',
    );
    await userEvent.click(within(dialog).getByRole('combobox', { name: /Current level/ }));
    await userEvent.click(screen.getByRole('option', { name: '5' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    await userEvent.click(screen.getByRole('button', { name: 'Delete Java' }));
    expect(screen.getByText('The skill “Java” will be deleted.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(requests.some((request) => request.method === 'DELETE')).toBe(true));
    expect(requests.find((request) => request.method === 'PATCH')?.body).toEqual({
      name: 'TypeScript',
      pattern: '\\bTypeScript\\b',
      level: 5,
    });
  });

  it('shows the skills as cards on a phone, edited in a full-screen dialog', async () => {
    mockMobileViewport();
    mockApi({ 'GET /api/skills/stats': { body: stats } });
    await renderWithProviders(<SkillsPage />, { path: '/skills', language: 'en' });

    const list = await screen.findByRole('list', { name: 'Skills sorted by frequency' });
    const cards = within(list).getAllByRole('listitem');
    expect(cards).toHaveLength(2);
    const first = within(cards[0] as HTMLElement);
    expect(first.getByText('TypeScript')).toBeInTheDocument();
    expect(first.getByText('\\bTypeScript\\b')).toBeInTheDocument();
    expect(first.getByText('6 postings')).toBeInTheDocument();
    expect(first.getByText('100%')).toBeInTheDocument();
    expect(within(cards[1] as HTMLElement).getByText('0 postings')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await userEvent.click(first.getByRole('button', { name: 'Edit TypeScript' }));

    const dialog = screen.getByRole('dialog', { name: 'Edit skill' });
    expect(dialog).toHaveClass('MuiDialog-paperFullScreen');
  });
});
