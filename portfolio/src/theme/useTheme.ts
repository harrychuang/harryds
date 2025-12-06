import { useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';

// 預設主題為 light
const DEFAULT_THEME: Theme = 'light';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // 只有當 localStorage 有明確儲存的值時才使用，否則預設為 light
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') as Theme | null : null;
    return saved || DEFAULT_THEME;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.setAttribute('theme', 'dark'); else root.removeAttribute('theme');
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 移除系統偏好監聽，不再根據系統設定自動切換
  // 使用者手動切換後會儲存到 localStorage

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, setTheme, toggleTheme };
};


