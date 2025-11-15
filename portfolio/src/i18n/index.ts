import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 英文資源
import enCommon from './locales/en/common.json';
import enAbout from './locales/en/about.json';
import enProjects from './locales/en/projects.json';
import enArticles from './locales/en/articles.json';

// 繁體中文資源
import zhHantCommon from './locales/zh-Hant/common.json';
import zhHantAbout from './locales/zh-Hant/about.json';
import zhHantProjects from './locales/zh-Hant/projects.json';
import zhHantArticles from './locales/zh-Hant/articles.json';

// 日文資源
import jaCommon from './locales/ja/common.json';
import jaAbout from './locales/ja/about.json';
import jaProjects from './locales/ja/projects.json';
import jaArticles from './locales/ja/articles.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['zh-Hant', 'zh', 'en', 'ja'],
    // 使用 namespace 來組織資源
    ns: ['common', 'about', 'projects', 'articles'],
    defaultNS: 'common',
    resources: {
      'zh-Hant': { 
        common: zhHantCommon,
        about: zhHantAbout,
        projects: zhHantProjects,
        articles: zhHantArticles
      },
      'zh': { 
        common: zhHantCommon,
        about: zhHantAbout,
        projects: zhHantProjects,
        articles: zhHantArticles
      },
      en: { 
        common: enCommon,
        about: enAbout,
        projects: enProjects,
        articles: enArticles
      },
      ja: { 
        common: jaCommon,
        about: jaAbout,
        projects: jaProjects,
        articles: jaArticles
      }
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


