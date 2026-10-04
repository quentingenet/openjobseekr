import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockApi, problem } from '../../test/api-mock';
import { APPLICATION_ID, application } from '../../test/fixtures';
import { renderWithProviders } from '../../test/render';
import { EditApplicationPage, NewApplicationPage } from './ApplicationFormPage';

const detailUrl = `/api/applications/${APPLICATION_ID}`;

describe('application form pages', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('edit: only sends the changed fields, then opens the detail', async () => {
    const { requests } = mockApi({
      [`GET ${detailUrl}`]: { body: application },
      [`PATCH ${detailUrl}`]: {
        body: { ...application, status: 'HR_INTERVIEW', notes: 'Call on Monday' },
      },
      'GET /api/settings': { body: { followUpDelayDays: 7 } },
    });
    const { router } = await renderWithProviders(<EditApplicationPage />, {
      path: '/applications/:id/edit',
      url: `/applications/${APPLICATION_ID}/edit`,
      language: 'en',
    });

    await userEvent.click(await screen.findByRole('combobox', { name: /Status/ }));
    await userEvent.click(screen.getByRole('option', { name: 'HR interview' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Notes' }), 'Call on Monday');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/applications/${APPLICATION_ID}`),
    );
    const patch = requests.find((request) => request.method === 'PATCH');
    expect(patch?.body).toEqual({ status: 'HR_INTERVIEW', notes: 'Call on Monday' });
  });

  it('edit: shows an API error on a select field', async () => {
    mockApi({
      [`GET ${detailUrl}`]: { body: application },
      [`PATCH ${detailUrl}`]: {
        status: 400,
        body: problem(400, 'VALIDATION_FAILED', [{ field: 'channel', constraints: ['isEnum'] }]),
      },
      'GET /api/settings': { body: { followUpDelayDays: 7 } },
    });
    await renderWithProviders(<EditApplicationPage />, {
      path: '/applications/:id/edit',
      url: `/applications/${APPLICATION_ID}/edit`,
      language: 'en',
    });

    await userEvent.click(await screen.findByRole('combobox', { name: /Channel/ }));
    await userEvent.click(screen.getByRole('option', { name: 'APEC' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Invalid value')).toBeInTheDocument();
    expect(screen.getByText('Some fields are invalid.')).toBeInTheDocument();
  });

  it('new: creates the application with empty fields as null', async () => {
    const { requests } = mockApi({
      'POST /api/applications': { status: 201, body: application },
      'GET /api/settings': { body: { followUpDelayDays: 7 } },
    });
    const { router } = await renderWithProviders(<NewApplicationPage />, {
      path: '/applications/new',
      language: 'en',
    });

    await userEvent.type(screen.getByRole('textbox', { name: /Company/ }), 'Acme');
    await userEvent.type(screen.getByRole('textbox', { name: /Job title/ }), 'Backend developer');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/applications/${APPLICATION_ID}`),
    );
    const post = requests.find((request) => request.method === 'POST');
    expect(post?.body).toMatchObject({
      company: 'Acme',
      jobTitle: 'Backend developer',
      status: 'SENT',
      channel: null,
      notes: null,
    });
  });

  it('asks before leaving with unsaved changes', async () => {
    mockApi({ 'GET /api/settings': { body: { followUpDelayDays: 7 } } });
    const { router } = await renderWithProviders(<NewApplicationPage />, {
      path: '/applications/new',
      language: 'en',
    });

    await userEvent.type(screen.getByRole('textbox', { name: /Company/ }), 'Acme');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(
      await screen.findByRole('dialog', { name: 'Leave without saving?' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Stay' }));
    // Wait for the closing animation: the page stays hidden from assistive tech until then.
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(router.state.location.pathname).toBe('/applications/new');

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Leave' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/applications'));
  });

  it('leaves without asking when nothing was changed', async () => {
    mockApi({ 'GET /api/settings': { body: { followUpDelayDays: 7 } } });
    const { router } = await renderWithProviders(<NewApplicationPage />, {
      path: '/applications/new',
      language: 'en',
    });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/applications'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
