import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for tracking scroll progress as percentage
 * 監聽滾動進度的 Hook，返回 0-100 的百分比
 */
export const useScrollProgress = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  const updateScrollProgress = useCallback(() => {
    // 獲取當前滾動位置
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // 獲取文檔總高度和視窗高度
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    
    // 計算可滾動的總距離
    const scrollableHeight = docHeight - winHeight;
    
    if (scrollableHeight <= 0) {
      // 如果頁面高度不足以滾動，進度為 0
      setScrollProgress(0);
      return;
    }
    
    // 計算滾動百分比 (0-100)
    const progress = Math.round((scrollTop / scrollableHeight) * 100);
    
    // 確保範圍在 0-100 之間
    const clampedProgress = Math.max(0, Math.min(100, progress));
    
    setScrollProgress(clampedProgress);
  }, []);

  useEffect(() => {
    // 初始計算
    updateScrollProgress();
    
    // 監聽滾動事件
    const handleScroll = () => {
      // 使用 requestAnimationFrame 來優化性能
      requestAnimationFrame(updateScrollProgress);
    };
    
    // 監聽視窗大小改變（會影響可滾動高度）
    const handleResize = () => {
      requestAnimationFrame(updateScrollProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // 清理事件監聽器
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateScrollProgress]);

  return scrollProgress;
};
