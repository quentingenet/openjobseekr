import { createTheme, type Theme } from '@mui/material/styles';
import { enUS as coreEnUS, frFR as coreFrFR } from '@mui/material/locale';
import { enUS as pickersEnUS, frFR as pickersFrFR } from '@mui/x-date-pickers/locales';
import type { Language } from './i18n';

const localesByLanguage = {
  en: [coreEnUS, pickersEnUS],
  fr: [coreFrFR, pickersFrFR],
} as const;

/** Application theme with the MUI and date picker translations of the active language. */
export function createAppTheme(language: Language): Theme {
  return createTheme(
    {
      palette: {
        primary: { main: '#1f5fa8' },
        secondary: { main: '#7a4fb3' },
        background: { default: '#f5f7fa' },
      },
      shape: { borderRadius: 10 },
      components: {
        MuiTextField: { defaultProps: { fullWidth: true } },
        MuiFormControl: { defaultProps: { fullWidth: true } },
        MuiPaper: {
          defaultProps: { elevation: 0 },
          styleOverrides: { root: { border: '1px solid #e3e8ef' } },
        },
        MuiTableCell: { styleOverrides: { head: { fontWeight: 600 } } },
      },
    },
    ...localesByLanguage[language],
  );
}
