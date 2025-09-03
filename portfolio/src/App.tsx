import React from 'react';
import { Routes, Route, Link, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import { useTranslation } from 'react-i18next';
import { useTheme } from './theme/useTheme';

const App: React.FC = () => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app" data-theme={theme}>
      <header className="app-header">
        <nav className="nav">
          <NavLink to="/" end>{t('nav.home')}</NavLink>
          <NavLink to="/about">{t('nav.about')}</NavLink>
        </nav>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;


