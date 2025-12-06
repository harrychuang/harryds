/**
 * Google Analytics 路由追蹤 Hook
 * 當路由變化時自動追蹤頁面瀏覽
 */
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/analytics';

/**
 * 監聽路由變化並自動追蹤頁面瀏覽
 */
export const usePageTracking = (): void => {
  const location = useLocation();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    const currentPath = location.pathname + location.search;
    
    // 避免重複追蹤相同的路徑
    if (previousPathRef.current === currentPath) {
      return;
    }
    
    previousPathRef.current = currentPath;
    
    // 追蹤頁面瀏覽
    trackPageView(currentPath);
  }, [location]);
};

export default usePageTracking;

