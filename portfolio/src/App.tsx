import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Home from './pages/Home';
import About from './pages/About';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import ErrorPage from './pages/ErrorPage';
import Footer from './components/Footer';
import ClickFireworks from './components/ClickFireworks';
import PageLoader from './components/PageLoader';
import { HoverProvider } from './contexts/HoverContext';
import { OverlayProvider } from './contexts/OverlayContext';
import { DataSourceProvider } from './contexts/DataSourceContext';
import { PageLoaderProvider, usePageLoader } from './contexts/PageLoaderContext';
import { ContactModalProvider } from './contexts/ContactModalContext';
import { ScreenSaverProvider, useScreenSaver } from './contexts/ScreenSaverContext';
import { usePageTracking } from './hooks/useAnalytics';
import { ScreenSaver, mylifeImages } from 'hds/components';

// 內部 App 元件，可以使用 PageLoader context
const AppContent: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { isLoading } = usePageLoader();
  const { isActive: isScreenSaverActive, deactivate: closeScreenSaver } = useScreenSaver();
  
  // Google Analytics 路由追蹤
  usePageTracking();

  // 監聽語言變化，動態設置 html lang 屬性
  useEffect(() => {
    const updateLangAttr = () => {
      const lang = i18n.language.startsWith('zh') ? 'zh-Hant' : i18n.language;
      document.documentElement.lang = lang;
    };

    updateLangAttr();
    i18n.on('languageChanged', updateLangAttr);

    return () => {
      i18n.off('languageChanged', updateLangAttr);
    };
  }, [i18n]);

  // 預渲染就緒事件 - 當頁面載入完成後觸發
  // 注意：對於需要動態資料的頁面（如 ArticleDetail、Home），
  // 事件會在各自的組件中觸發，確保資料已載入
  useEffect(() => {
    // 只在非動態頁面（如 About）觸發
    // 動態頁面會在各自組件中觸發
    const pathname = window.location.pathname;
    const isDynamicPage = pathname.startsWith('/article/') || pathname.startsWith('/project/');
    
    if (!isLoading && !isDynamicPage) {
      // 延遲一小段時間確保 react-helmet-async 已更新 meta tags
      const timer = setTimeout(() => {
        document.dispatchEvent(new Event('prerender-ready'));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <div className="app">
      {/* 全域 PageLoader */}
      <PageLoader 
        isLoading={isLoading} 
        labels={['LOADING...', 'HARRY DESIGN STUDIO']}
        minDisplayTime={1500}
      />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/article/:id/:slug" element={<ArticleDetail />} />
        {/* project detail with SEO-friendly slug */}
        <Route path="/project/:id/:slug" element={<Home />} />
        {/* 404 catch-all route */}
        <Route path="*" element={<ErrorPage errorType="404" />} />
      </Routes>
      <Footer />
      <ClickFireworks />
      
      {/* 螢幕保護程式 - 閒置 1 分鐘或 Konami Code 觸發 */}
      <ScreenSaver
        images={mylifeImages}
        active={isScreenSaverActive}
        onClose={closeScreenSaver}
        showCloseButton={false}
        randomCount={100}
        spawnInterval={3}
        showClock={true}
        clockPixelSize={4}
        hintText={t('screenSaver.hint')}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DataSourceProvider>
      <HoverProvider>
        <OverlayProvider>
          <PageLoaderProvider>
            <ContactModalProvider>
              <ScreenSaverProvider>
                <AppContent />
              </ScreenSaverProvider>
            </ContactModalProvider>
          </PageLoaderProvider>
        </OverlayProvider>
      </HoverProvider>
    </DataSourceProvider>
  );
};

export default App;
