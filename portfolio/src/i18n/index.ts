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

// 自訂語言偵測器，處理各種中文變體
const customLanguageDetector = {
  name: 'customNavigator',
  lookup() {
    const browserLangs = navigator.languages || [navigator.language];
    
    for (const lang of browserLangs) {
      const lowerLang = lang.toLowerCase();
      
      // 中文變體處理（zh-TW, zh-Hant, zh-HK, zh-MO 等繁體地區 → zh-Hant）
      // （zh-CN, zh-Hans, zh-SG 等簡體地區也使用 zh-Hant，因為沒有簡體資源）
      if (lowerLang.startsWith('zh')) {
        return 'zh-Hant';
      }
      
      // 日文
      if (lowerLang.startsWith('ja')) {
        return 'ja';
      }
      
      // 英文
      if (lowerLang.startsWith('en')) {
        return 'en';
      }
    }
    
    return null;
  },
  cacheUserLanguage() {
    // 不快取，讓使用者手動選擇時才存到 localStorage
  }
};

// 建立語言偵測器實例
const languageDetector = new LanguageDetector();
languageDetector.addDetector(customLanguageDetector);

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['zh-Hant', 'en', 'ja'],
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
      // 偵測順序：querystring > localStorage > 自訂瀏覽器偵測
      order: ['querystring', 'localStorage', 'customNavigator'],
      lookupQuerystring: 'lang',
      caches: ['localStorage']
    },
    interpolation: { escapeValue: false },
    // 不使用 languageOnly，保留完整語言代碼（如 zh-Hant）
    load: 'currentOnly',
    nonExplicitSupportedLngs: false
  });

export default i18n;


