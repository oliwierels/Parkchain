import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import pl from './locales/pl.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector) // Automatyczne wykrywanie języka przeglądarki
  .use(initReactI18next)
  .init({
    resources: {
      pl: { translation: pl },
      en: { translation: en }
    },
    fallbackLng: 'pl', // Domyślny język
    lng: localStorage.getItem('language') || 'pl', // Przywróć zapisany język
    interpolation: {
      escapeValue: false // React już zabezpiecza przed XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
