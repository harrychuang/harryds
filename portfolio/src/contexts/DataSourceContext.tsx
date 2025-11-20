import React, { createContext, useContext, useState, useEffect } from 'react';

type DataSource = 'local' | 'strapi';

interface DataSourceContextValue {
  dataSource: DataSource;
  setDataSource: (source: DataSource) => void;
  toggleDataSource: () => void;
}

const DataSourceContext = createContext<DataSourceContextValue | undefined>(undefined);

export const DataSourceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 從 localStorage 讀取儲存的設定，預設為 strapi
  const [dataSource, setDataSourceState] = useState<DataSource>(() => {
    const saved = localStorage.getItem('portfolio-data-source');
    return (saved === 'local' || saved === 'strapi') ? saved : 'strapi';
  });

  // 當資料來源改變時，儲存到 localStorage
  useEffect(() => {
    localStorage.setItem('portfolio-data-source', dataSource);
    console.log('[DataSource] 資料來源切換為:', dataSource);
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

