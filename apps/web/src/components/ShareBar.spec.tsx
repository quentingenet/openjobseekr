import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import i18n from '../i18n';
import { ShareBar } from './ShareBar';

describe('ShareBar', () => {
  it('shows the ratio as a labelled bar and a localized percentage', async () => {
    await i18n.changeLanguage('en');
    render(<ShareBar ratio={0.4} label="LinkedIn" />);

    expect(screen.getByRole('progressbar', { name: 'LinkedIn' })).toHaveAttribute(
      'aria-valuenow',
      '40',
    );
    expect(screen.getByText('40%')).toBeInTheDocument();
  });
});
