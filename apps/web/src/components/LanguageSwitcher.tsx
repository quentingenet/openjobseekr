import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type Language, toLanguage } from '../i18n';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const value = toLanguage(i18n.resolvedLanguage);

  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={value}
      aria-label={t('language.label')}
      onChange={(_event, language: Language | null) => {
        if (language) void i18n.changeLanguage(language);
      }}
      sx={{ bgcolor: 'background.paper' }}
    >
      {SUPPORTED_LANGUAGES.map((language) => (
        <ToggleButton key={language} value={language} aria-label={t(`language.${language}`)}>
          {language.toUpperCase()}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
