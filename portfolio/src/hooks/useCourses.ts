import { useMemo } from 'react';
import { useLocalCourses } from './useLocalCourses';
import { useDataSource } from '../contexts/DataSourceContext';
import type { CourseItem } from './useLocalCourses';

/**
 * 統一的課程資料 Hook
 * 目前只支援本地資料，未來可擴展支援 Strapi
 */
export function useCourses(): {
  items: CourseItem[];
  loading: boolean;
  error: Error | null;
  dataSource: 'local' | 'strapi';
} {
  const { dataSource } = useDataSource();
  
  // 取得本地資料來源的資料
  const localData = useLocalCourses();
  
  // 目前只使用本地資料，未來可根據 dataSource 切換
  const result = useMemo(() => {
    return {
      items: localData.items,
      loading: localData.loading,
      error: localData.error,
      dataSource: 'local' as const
    };
  }, [localData]);
  
  return result;
}

// 重新導出 CourseItem 類型
export type { CourseItem } from './useLocalCourses';
