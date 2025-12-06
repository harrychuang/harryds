/**
 * useHoverCapability Hook
 * 
 * 檢測設備是否真正支援 hover 互動（非觸控設備）。
 * 使用 CSS Media Query `(hover: hover)` 來判斷。
 * 
 * 用途：
 * - 在觸控設備上禁用 hover 效果，避免「需要點兩次」的問題
 * - 在桌面設備上保持完整的 hover 互動體驗
 */

import { useState, useEffect } from 'react';

/**
 * 檢測設備是否支援 hover
 * @returns {boolean} 如果設備支援 hover 則返回 true
 */
export const useHoverCapability = (): boolean => {
  const [hasHover, setHasHover] = useState(() => {
    // SSR 安全：預設為 true（桌面設備較常見）
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(hover: hover)').matches;
  });

  useEffect(() => {
    // 監聽 media query 變化（例如：連接/斷開滑鼠）
    const mediaQuery = window.matchMedia('(hover: hover)');
    
    const handleChange = (event: MediaQueryListEvent) => {
      setHasHover(event.matches);
    };

    // 使用 addEventListener（現代 API）
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // 舊版瀏覽器 fallback
      mediaQuery.addListener(handleChange);
    }

    // 初始化時再次檢查（確保 SSR hydration 後狀態正確）
    setHasHover(mediaQuery.matches);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return hasHover;
};

/**
 * 檢測設備是否為觸控設備
 * @returns {boolean} 如果設備支援觸控則返回 true
 */
export const useTouchCapability = (): boolean => {
  const [hasTouch, setHasTouch] = useState(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  useEffect(() => {
    setHasTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return hasTouch;
};

export default useHoverCapability;
