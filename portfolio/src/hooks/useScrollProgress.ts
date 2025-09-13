import { useState, useEffect, useCallback } from 'react';

interface ScrollProgressOptions {
  /** 自定義滾動容器，如果不提供則監聽 window 滾動 */
  scrollContainer?: HTMLElement | null;
}

/**
 * Hook for tracking scroll progress as percentage
 * 監聽滾動進度的 Hook，返回 0-100 的百分比
 * @param options - 配置選項，可指定自定義滾動容器
 */
export const useScrollProgress = (options: ScrollProgressOptions = {}) => {
  const { scrollContainer } = options;
  const [scrollProgress, setScrollProgress] = useState(0);

  const updateScrollProgress = useCallback(() => {
    let scrollTop: number;
    let scrollableHeight: number;
    
    if (scrollContainer) {
      // 使用自定義滾動容器
      scrollTop = scrollContainer.scrollTop;
      const containerHeight = scrollContainer.clientHeight;
      const contentHeight = scrollContainer.scrollHeight;
      scrollableHeight = contentHeight - containerHeight;
    } else {
      // 使用 window 滾動
      scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      scrollableHeight = docHeight - winHeight;
    }
    
    if (scrollableHeight <= 0) {
      // 如果高度不足以滾動，進度為 0
      setScrollProgress(0);
      return;
    }
    
    // 計算滾動百分比 (0-100)
    const progress = Math.round((scrollTop / scrollableHeight) * 100);
    
    // 確保範圍在 0-100 之間
    const clampedProgress = Math.max(0, Math.min(100, progress));
    
    setScrollProgress(clampedProgress);
  }, [scrollContainer]);

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

    // 決定要監聽的目標元素
    const scrollTarget = scrollContainer || window;
    const resizeTarget = window; // resize 事件總是監聽 window
    
    if (scrollContainer) {
      // 監聽自定義滾動容器
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      // 監聽 window 滾動
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    resizeTarget.addEventListener('resize', handleResize, { passive: true });

    // 清理事件監聽器
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      } else {
        window.removeEventListener('scroll', handleScroll);
      }
      resizeTarget.removeEventListener('resize', handleResize);
    };
  }, [updateScrollProgress, scrollContainer]);

  return scrollProgress;
};
