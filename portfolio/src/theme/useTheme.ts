import { useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';

const getPreferredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') as Theme | null : null;
    return saved || getPreferredTheme();
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.setAttribute('theme', 'dark'); else root.removeAttribute('theme');
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      const saved = localStorage.getItem('theme');
      if (!saved) {
        setTheme(media.matches ? 'dark' : 'light');
      }
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, setTheme, toggleTheme };
};


