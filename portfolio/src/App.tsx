import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Footer from './components/Footer';
import { HoverProvider } from './contexts/HoverContext';

const App: React.FC = () => {
  return (
    <HoverProvider>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* category: article | project; id + slug SEO */}
          <Route path=":category/:id/:slug" element={<Home />} />
        </Routes>
        <Footer />
      </div>
    </HoverProvider>
  );
};

export default App;


