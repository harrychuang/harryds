import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface PageLoaderContextType {
  /** 是否正在載入 */
  isLoading: boolean;
  /** 開始載入 */
  startLoading: () => void;
  /** 結束載入 */
  stopLoading: () => void;
  /** 設置載入狀態 */
  setLoading: (loading: boolean) => void;
}

const PageLoaderContext = createContext<PageLoaderContextType | undefined>(undefined);

interface PageLoaderProviderProps {
  children: ReactNode;
}

export const PageLoaderProvider: React.FC<PageLoaderProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true); // 預設為 true，首次載入顯示

  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return (
    <PageLoaderContext.Provider value={{ isLoading, startLoading, stopLoading, setLoading }}>
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

