import {
  alpha,
  createTheme,
  responsiveFontSizes,
  type Shadows,
  type Theme,
} from '@mui/material/styles';
import { enUS as coreEnUS, esES as coreEsES, frFR as coreFrFR } from '@mui/material/locale';
import {
  enUS as pickersEnUS,
  esES as pickersEsES,
  frFR as pickersFrFR,
} from '@mui/x-date-pickers/locales';
import type { Language } from './i18n';

const localesByLanguage = {
  en: [coreEnUS, pickersEnUS],
  fr: [coreFrFR, pickersFrFR],
  es: [coreEsES, pickersEsES],
} as const;

// Self-hosted through @fontsource-variable/montserrat (imported in main.tsx): no network call.
export const FONT_FAMILY = '"Montserrat Variable", "Montserrat", "Helvetica", "Arial", sans-serif';

const palette = {
  primary: { light: '#4f86c6', main: '#1f5fa8', dark: '#154378' },
  secondary: { light: '#9d7bc9', main: '#7a4fb3', dark: '#5a3888' },
  success: { main: '#2e8b6a' },
  warning: { main: '#d08a2c' },
  error: { main: '#c94a4a' },
  info: { main: '#3a8fb7' },
  text: { primary: '#1c2433', secondary: '#5b6577' },
  divider: '#e4e9f1',
  background: { default: '#f3f6fb', paper: '#ffffff' },
};

/** Soft, slightly blue-tinted shadows: each level grows in blur and offset. */
function softShadows(): Shadows {
  const tint = '16, 34, 68';
  const levels = Array.from({ length: 24 }, (_, index) => {
    const level = index + 1;
    const offset = Math.round(level * 1.5);
    const blur = 4 + level * 4;
    return `0 1px 2px rgba(${tint}, 0.04), 0 ${offset}px ${blur}px rgba(${tint}, ${Math.min(0.06 + level * 0.005, 0.16)})`;
  });
  return ['none', ...levels] as Shadows;
}

export function createAppTheme(language: Language): Theme {
  // Headings shrink on small screens (e.g. page titles on a phone).
  return responsiveFontSizes(
    createTheme(
      {
        palette,
        shape: { borderRadius: 12 },
        shadows: softShadows(),
        typography: {
          fontFamily: FONT_FAMILY,
          h4: { fontWeight: 700, letterSpacing: '-0.02em' },
          h5: { fontWeight: 700, letterSpacing: '-0.01em' },
          h6: { fontWeight: 600 },
          subtitle1: { fontWeight: 600 },
          button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                backgroundImage: `radial-gradient(circle at 0% 0%, ${alpha(palette.primary.main, 0.06)}, transparent 40%), radial-gradient(circle at 100% 0%, ${alpha(palette.secondary.main, 0.05)}, transparent 35%)`,
                backgroundAttachment: 'fixed',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundImage: `linear-gradient(120deg, ${palette.primary.dark} 0%, ${palette.primary.main} 60%, ${palette.secondary.main} 140%)`,
                boxShadow: `0 4px 20px ${alpha(palette.primary.dark, 0.25)}`,
              },
            },
          },
          MuiPaper: {
            defaultProps: { elevation: 1 },
            styleOverrides: {
              root: { backgroundImage: 'none' },
              rounded: { borderRadius: 14 },
              elevation1: { border: `1px solid ${alpha(palette.divider, 0.8)}` },
            },
          },
          MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
              root: {
                borderRadius: 10,
                paddingInline: 16,
                variants: [
                  {
                    props: { variant: 'contained', color: 'primary' },
                    style: {
                      backgroundImage: `linear-gradient(135deg, ${palette.primary.main}, ${palette.primary.dark})`,
                      boxShadow: `0 4px 12px ${alpha(palette.primary.main, 0.25)}`,
                      '&:hover': { boxShadow: `0 6px 18px ${alpha(palette.primary.main, 0.35)}` },
                      '&.Mui-disabled': { backgroundImage: 'none', boxShadow: 'none' },
                    },
                  },
                ],
              },
            },
          },
          MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
          MuiTextField: { defaultProps: { fullWidth: true } },
          MuiFormControl: { defaultProps: { fullWidth: true } },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                backgroundColor: palette.background.paper,
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(palette.primary.main, 0.5),
                },
              },
              notchedOutline: { borderColor: palette.divider },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: { borderColor: palette.divider },
              head: {
                fontWeight: 600,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
                color: palette.text.secondary,
                backgroundColor: '#f7f9fc',
              },
            },
          },
          MuiTableRow: {
            styleOverrides: {
              root: {
                transition: 'background-color 120ms ease',
                '&.MuiTableRow-hover:hover': { backgroundColor: alpha(palette.primary.main, 0.04) },
              },
            },
          },
          MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
          MuiTooltip: {
            styleOverrides: {
              tooltip: { backgroundColor: palette.text.primary, fontSize: '0.75rem' },
            },
          },
        },
      },
      ...localesByLanguage[language],
    ),
  );
}
