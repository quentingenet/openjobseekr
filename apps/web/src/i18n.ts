import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import fr from './locales/fr/translation.json';

export const SUPPORTED_LANGUAGES = ['en', 'fr'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const resources = {
  en: { translation: en },
  fr: { translation: fr },
} as const;

/** Keeps `<html lang>` in sync for screen readers and the browser's date pickers. */
function syncHtmlLang(language: string): void {
  document.documentElement.lang = language;
}

i18n.on('languageChanged', syncHtmlLang);

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    // Language: saved choice first, then the browser's.
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'openjobseekr.language',
    },
    interpolation: { escapeValue: false }, // React already escapes rendered values.
    returnNull: false,
  });

export function currentLanguage(): Language {
  return i18n.resolvedLanguage === 'fr' ? 'fr' : 'en';
}

export default i18n;
