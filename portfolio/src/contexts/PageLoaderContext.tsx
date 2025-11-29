import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';

interface PageLoaderContextType {
  /** 是否正在載入 */
  isLoading: boolean;
  /** loading 動畫是否已完成（包含退出動畫） */
  isAnimationComplete: boolean;
  /** 開始載入 */
  startLoading: () => void;
  /** 結束載入 */
  stopLoading: () => void;
  /** 設置載入狀態 */
  setLoading: (loading: boolean) => void;
  /** 設置動畫完成狀態 */
  setAnimationComplete: (complete: boolean) => void;
  /** 檢查頁面是否已載入過 */
  isPageLoaded: (pageName: string) => boolean;
  /** 標記頁面為已載入 */
  markPageAsLoaded: (pageName: string) => void;
  /** 重置頁面載入狀態（用於強制重新載入） */
  resetPageLoadState: (pageName?: string) => void;
}

const PageLoaderContext = createContext<PageLoaderContextType | undefined>(undefined);

interface PageLoaderProviderProps {
  children: ReactNode;
}

export const PageLoaderProvider: React.FC<PageLoaderProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true); // 預設為 true，首次載入顯示
  const [isAnimationComplete, setIsAnimationComplete] = useState(false); // 動畫是否完成
  
  // 追蹤已載入的頁面
  const loadedPagesRef = useRef<Set<string>>(new Set());

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setIsAnimationComplete(false);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
    if (loading) {
      setIsAnimationComplete(false);
    }
  }, []);

  const setAnimationComplete = useCallback((complete: boolean) => {
    setIsAnimationComplete(complete);
  }, []);

  // 檢查頁面是否已載入過
  const isPageLoaded = useCallback((pageName: string) => {
    return loadedPagesRef.current.has(pageName);
  }, []);

  // 標記頁面為已載入
  const markPageAsLoaded = useCallback((pageName: string) => {
    loadedPagesRef.current.add(pageName);
  }, []);

  // 重置頁面載入狀態
  const resetPageLoadState = useCallback((pageName?: string) => {
    if (pageName) {
      loadedPagesRef.current.delete(pageName);
    } else {
      loadedPagesRef.current.clear();
    }
  }, []);

  return (
    <PageLoaderContext.Provider value={{ 
      isLoading, 
      isAnimationComplete,
      startLoading, 
      stopLoading, 
      setLoading,
      setAnimationComplete,
      isPageLoaded,
      markPageAsLoaded,
      resetPageLoadState
    }}>
      {children}
    </PageLoaderContext.Provider>
  );
};

export const usePageLoader = (): PageLoaderContextType => {
  const context = useContext(PageLoaderContext);
  if (!context) {
    throw new Error('usePageLoader must be used within a PageLoaderProvider');
  }
  return context;
};

export default PageLoaderContext;
