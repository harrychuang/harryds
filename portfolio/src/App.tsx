import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Home from './pages/Home';
import About from './pages/About';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import Footer from './components/Footer';
import ClickFireworks from './components/ClickFireworks';
import PageLoader from './components/PageLoader';
import { HoverProvider } from './contexts/HoverContext';
import { OverlayProvider } from './contexts/OverlayContext';
import { DataSourceProvider } from './contexts/DataSourceContext';
import { PageLoaderProvider, usePageLoader } from './contexts/PageLoaderContext';

// 內部 App 元件，可以使用 PageLoader context
const AppContent: React.FC = () => {
  const { i18n } = useTranslation();
  const { isLoading } = usePageLoader();

  // 監聽語言變化，動態設置 html lang 屬性
  useEffect(() => {
    const updateLangAttr = () => {
      const lang = i18n.language === 'zh' ? 'zh-Hant' : i18n.language;
      document.documentElement.lang = lang;
    };

    updateLangAttr();
    i18n.on('languageChanged', updateLangAttr);

    return () => {
      i18n.off('languageChanged', updateLangAttr);
    };
  }, [i18n]);

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
      </Routes>
      <Footer />
      <ClickFireworks />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DataSourceProvider>
      <HoverProvider>
        <OverlayProvider>
          <PageLoaderProvider>
            <AppContent />
          </PageLoaderProvider>
        </OverlayProvider>
      </HoverProvider>
    </DataSourceProvider>
  );
};

export default App;
