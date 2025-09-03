import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

const App: React.FC = () => {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        {/* category: article | project; id + slug SEO */}
        <Route path=":category/:id/:slug" element={<Home />} />
      </Routes>
    </div>
  );
};

export default App;


