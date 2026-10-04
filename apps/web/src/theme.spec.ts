import { createAppTheme, FONT_FAMILY } from './theme';

describe('createAppTheme', () => {
  it('uses Montserrat as the main font', () => {
    const theme = createAppTheme('en');

    expect(FONT_FAMILY.startsWith('"Montserrat Variable"')).toBe(true);
    expect(theme.typography.fontFamily).toBe(FONT_FAMILY);
    expect(theme.typography.button.textTransform).toBe('none');
  });

  it('defines 25 soft shadow levels, the first one being none', () => {
    const theme = createAppTheme('en');

    expect(theme.shadows).toHaveLength(25);
    expect(theme.shadows[0]).toBe('none');
    expect(theme.shadows[1]).toBe(
      '0 1px 2px rgba(16, 34, 68, 0.04), 0 2px 8px rgba(16, 34, 68, 0.065)',
    );
  });

  it('raises Paper surfaces to the first shadow level by default', () => {
    const theme = createAppTheme('fr');

    expect(theme.components?.MuiPaper?.defaultProps?.elevation).toBe(1);
  });
});

describe('table header cells', () => {
  it('never wrap their label (sort icon included)', () => {
    const theme = createAppTheme('fr');
    const overrides = theme.components?.MuiTableCell?.styleOverrides?.head as Record<
      string,
      unknown
    >;

    expect(overrides.whiteSpace).toBe('nowrap');
  });
});

describe('responsive headings', () => {
  it('make page titles (h4) smaller on phones than on large screens', () => {
    const { h4 } = createAppTheme('en').typography;
    const largeScreen = (h4 as Record<string, unknown>)['@media (min-width:1200px)'] as {
      fontSize: string;
    };

    expect(Number.parseFloat(String(h4.fontSize))).toBeLessThan(
      Number.parseFloat(largeScreen.fontSize),
    );
  });
});
