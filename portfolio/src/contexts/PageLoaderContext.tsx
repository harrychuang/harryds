import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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
}

const PageLoaderContext = createContext<PageLoaderContextType | undefined>(undefined);

interface PageLoaderProviderProps {
  children: ReactNode;
}

export const PageLoaderProvider: React.FC<PageLoaderProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true); // 預設為 true，首次載入顯示
  const [isAnimationComplete, setIsAnimationComplete] = useState(false); // 動畫是否完成

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setIsAnimationComplete(false); // 開始載入時重置動畫完成狀態
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
    if (loading) {
      setIsAnimationComplete(false); // 開始載入時重置動畫完成狀態
    }
  }, []);

  const setAnimationComplete = useCallback((complete: boolean) => {
    setIsAnimationComplete(complete);
  }, []);

  return (
    <PageLoaderContext.Provider value={{ 
      isLoading, 
      isAnimationComplete,
      startLoading, 
      stopLoading, 
      setLoading,
      setAnimationComplete
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
