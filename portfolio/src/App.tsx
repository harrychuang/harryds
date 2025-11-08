import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Footer from './components/Footer';
import ClickFireworks from './components/ClickFireworks';
import { HoverProvider } from './contexts/HoverContext';
import { OverlayProvider } from './contexts/OverlayContext';

const App: React.FC = () => {
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


