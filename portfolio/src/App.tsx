import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Home from './pages/Home';
import About from './pages/About';
import Footer from './components/Footer';
import ClickFireworks from './components/ClickFireworks';
import { HoverProvider } from './contexts/HoverContext';
import { OverlayProvider } from './contexts/OverlayContext';

const App: React.FC = () => {
  const { i18n } = useTranslation();

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
    <HoverProvider>
      <OverlayProvider>
        <div className="app">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            {/* category: article | project; id + slug SEO */}
            <Route path=":category/:id/:slug" element={<Home />} />
          </Routes>
          <Footer />
          <ClickFireworks />
        </div>
      </OverlayProvider>
    </HoverProvider>
  );
};

export default App;


