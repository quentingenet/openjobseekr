import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TruncatedText } from './TruncatedText';

const LONG_TITLE = 'Développeur·se Full-Stack TypeScript / React / Node.js (H/F) – CDI Paris';

/** jsdom does not lay out text: fake the measured widths. */
function fakeWidths(scrollWidth: number, clientWidth: number) {
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(scrollWidth);
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(clientWidth);
}

describe('TruncatedText', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('cuts the text with CSS and keeps the full text in the page', () => {
    render(<TruncatedText sx={{ maxWidth: 120 }}>{LONG_TITLE}</TruncatedText>);

    const text = screen.getByText(LONG_TITLE);
    expect(text).toHaveStyle({
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    });
  });

  it('shows the full text in a tooltip on hover when it is cut', async () => {
    fakeWidths(480, 120);
    render(<TruncatedText sx={{ maxWidth: 120 }}>{LONG_TITLE}</TruncatedText>);

    await userEvent.hover(screen.getByText(LONG_TITLE));

    expect(await screen.findByRole('tooltip')).toHaveTextContent(LONG_TITLE);
  });

  it('shows no tooltip when the text fits', async () => {
    fakeWidths(80, 120);
    render(<TruncatedText sx={{ maxWidth: 120 }}>Acme</TruncatedText>);

    await userEvent.hover(screen.getByText('Acme'));
    // Longer than the 300 ms enter delay.
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
