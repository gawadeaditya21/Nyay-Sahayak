import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'mr', 'bn', 'ta', 'te', 'kn', 'gu', 'pa', 'ml', 'or', 'ur', 'hinglish'],
    ns: ['common', 'landing', 'chat', 'fir', 'analyze'],
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'nyaySahayakLanguage',
    },
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    debug: false,
  });

export default i18n;
