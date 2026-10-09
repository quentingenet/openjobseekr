import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Notification, NotificationProvider, useNotify } from './NotificationProvider';

function Trigger({ notification }: { notification: Notification }) {
  const notify = useNotify();
  return <button onClick={() => notify(notification)}>notify</button>;
}

function renderTrigger(notification: Notification) {
  render(
    <NotificationProvider>
      <Trigger notification={notification} />
    </NotificationProvider>,
  );
  return screen.getByRole('button', { name: 'notify' });
}

describe('NotificationProvider', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a message with an action, which closes it', async () => {
    const onClick = vi.fn();
    await userEvent.click(renderTrigger({ message: 'Saved', action: { label: 'Undo', onClick } }));

    expect(screen.getByText('Saved')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('shows an error as an alert', async () => {
    await userEvent.click(renderTrigger({ message: 'Failed', severity: 'error' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
  });

  it('hides itself after a while, but not on a click elsewhere', () => {
    vi.useFakeTimers();
    const trigger = renderTrigger({ message: 'Saved' });
    act(() => trigger.click());

    act(() => document.body.click());
    expect(screen.getByText('Saved')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('refuses to be used outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Trigger notification={{ message: 'x' }} />)).toThrow(
      'useNotify must be used inside NotificationProvider',
    );
  });
});
