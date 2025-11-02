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
    fallbackLng: 'en',
    supportedLngs: ['zh-Hant', 'zh', 'en', 'ja'],
    resources: {
      'zh-Hant': { translation: zhHant },
      'zh': { translation: zhHant }, // 將 zh 也映射到繁體中文
      en: { translation: en },
      ja: { translation: ja }
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lang',
      caches: ['localStorage']
    },
    interpolation: { escapeValue: false },
    // 確保語言代碼標準化
    load: 'languageOnly',
    nonExplicitSupportedLngs: false
  });

export default i18n;


