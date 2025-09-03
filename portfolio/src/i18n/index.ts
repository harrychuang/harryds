import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhHant from './locales/zh-Hant.json';
import en from './locales/en.json';
import ja from './locales/ja.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'zh-Hant',
    supportedLngs: ['zh-Hant', 'en', 'ja'],
    resources: {
      'zh-Hant': { translation: zhHant },
      en: { translation: en },
      ja: { translation: ja }
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lang',
      caches: ['localStorage']
    },
    interpolation: { escapeValue: false }
  });

export default i18n;


