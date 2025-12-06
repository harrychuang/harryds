import React, { createContext, useContext, useState, useEffect } from 'react';

type DataSource = 'local' | 'strapi';

interface DataSourceContextValue {
  dataSource: DataSource;
  setDataSource: (source: DataSource) => void;
  toggleDataSource: () => void;
}

const DataSourceContext = createContext<DataSourceContextValue | undefined>(undefined);

export const DataSourceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 生產環境強制使用 strapi，開發環境可從 localStorage 讀取
  const [dataSource, setDataSourceState] = useState<DataSource>(() => {
    // 生產環境（noeinoi.com）強制使用 strapi
    if (typeof window !== 'undefined' && window.location.hostname === 'noeinoi.com') {
      return 'strapi';
    }
    // 開發環境從 localStorage 讀取，預設為 strapi
    const saved = localStorage.getItem('portfolio-data-source');
    return (saved === 'local' || saved === 'strapi') ? saved : 'strapi';
  });

  // 當資料來源改變時，儲存到 localStorage
  useEffect(() => {
    localStorage.setItem('portfolio-data-source', dataSource);
  }, [dataSource]);

  const setDataSource = (source: DataSource) => {
    setDataSourceState(source);
  };

  const toggleDataSource = () => {
    setDataSourceState(prev => prev === 'local' ? 'strapi' : 'local');
  };

  return (
    <DataSourceContext.Provider value={{ dataSource, setDataSource, toggleDataSource }}>
      {children}
    </DataSourceContext.Provider>
  );
};

export const useDataSource = () => {
  const context = useContext(DataSourceContext);
  if (context === undefined) {
    throw new Error('useDataSource must be used within a DataSourceProvider');
  }
  return context;
};

