import { useMemo } from 'react';
import { useStrapiProjects } from './useStrapiProjects';
import { useLocalProjects } from './useLocalProjects';
import { useDataSource } from '../contexts/DataSourceContext';
import type { FeedItem } from '../../../harryds/src/types/feed';

/**
 * 統一的專案資料 Hook
 * 根據 DataSource Context 的設定，自動選擇從 Strapi 或本地 locales 取得資料
 */
export function useProjects(): {
  items: FeedItem[];
  loading: boolean;
  error: Error | null;
  dataSource: 'local' | 'strapi';
} {
  const { dataSource } = useDataSource();
  
  // 取得兩種資料來源的資料
  const strapiData = useStrapiProjects();
  const localData = useLocalProjects();
  
  // 根據當前設定選擇資料來源
  const result = useMemo(() => {
    if (dataSource === 'local') {
      console.log('[useProjects] 使用本地資料來源');
      return {
        items: localData.items,
        loading: localData.loading,
        error: localData.error,
        dataSource: 'local' as const
      };
    } else {
      console.log('[useProjects] 使用 Strapi 資料來源');
      return {
        items: strapiData.items,
        loading: strapiData.loading,
        error: strapiData.error,
        dataSource: 'strapi' as const
      };
    }
  }, [dataSource, strapiData, localData]);
  
  return result;
}

