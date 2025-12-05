import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { FeedItem } from '../../../harryds/src/types/feed';

// 預載本地資產
const imageModules = import.meta.glob<{ default: string }>(
  '../../assets/imgs/**/*.{jpg,jpeg,png,gif,webp,svg,mp4,webm}',
  { eager: true }
);

/**
 * 解析本地圖片路徑
 */
const resolveLocalImageUrl = (path?: string): string | undefined => {
  if (!path) return undefined;

  // 如果是完整 URL，直接返回
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // 嘗試對應到本地資產
  const normalized = path.replace(/^@assets\/imgs\//, '').replace(/^\/+/, '');
  const fullPath = `../../assets/imgs/${normalized}`;

  if (imageModules[fullPath]) {
    return imageModules[fullPath].default;
  }

  // 嘗試模糊匹配
  for (const [key, module] of Object.entries(imageModules)) {
    if (key.endsWith(normalized) || key.endsWith(`/${normalized}`)) {
      return module.default;
    }
  }

  console.warn('[useLocalArticles] 找不到本地圖片:', path);
  return undefined;
};

/**
 * 將本地 i18n 資料轉換為 FeedItem 格式
 */
const transformLocalToFeedItem = (id: string, data: any, originalHeading?: string): FeedItem => {
  // 解析 images 陣列中的圖片路徑
  const images = (data.images || []).map((img: string) => resolveLocalImageUrl(img));
  
  return {
    id: parseInt(id),
    heading: data.heading || '',
    originalHeading: originalHeading || data.heading || '',
    subtitle: data.subtitle || '',
    date: data.date || '',
    tags: data.tags || [],
    category: data.category || 'article',
    url: data.url,
    heroImage: images[0] || resolveLocalImageUrl(data.heroImage),
    images,
    content: data.content
  };
};

// ============================================================================
// Cache 機制 - 避免每次組件 mount 時重新載入資料
// ============================================================================
interface LocalArticlesCache {
  items: FeedItem[];
  locale: string;
  timestamp: number;
}

let localArticlesCache: LocalArticlesCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘快取有效期

/**
 * Hook: 從本地 i18n locales 取得文章資料
 * 包含 cache 機制，避免重複載入
 */
export function useLocalArticles() {
  const { i18n } = useTranslation();
  
  // 檢查是否有有效的 cache
  const hasValidCache = localArticlesCache && 
    localArticlesCache.locale === i18n.language &&
    (Date.now() - localArticlesCache.timestamp) < CACHE_DURATION;
  
  // 如果有有效 cache，初始值使用 cache 的資料，且 loading 為 false
  const [items, setItems] = useState<FeedItem[]>(hasValidCache ? localArticlesCache!.items : []);
  const [loading, setLoading] = useState(!hasValidCache);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLocalArticles() {
      // 如果有有效的 cache，跳過載入
      if (localArticlesCache && 
          localArticlesCache.locale === i18n.language &&
          (Date.now() - localArticlesCache.timestamp) < CACHE_DURATION) {
        if (isMounted) {
          setItems(localArticlesCache.items);
          setLoading(false);
        }
        return;
      }

      try {
        // 只有在沒有 cache 資料時才設定 loading = true
        if (items.length === 0) {
          setLoading(true);
        }
        setError(null);
        
        // 根據當前語言載入對應的 articles.json
        const locale = i18n.language === 'zh' ? 'zh-Hant' : i18n.language;
        
        // 首先載入英文版本以取得 originalHeading
        let enArticlesData: any;
        try {
          enArticlesData = await import(`../i18n/locales/en/articles.json`);
        } catch (err) {
          console.error('[useLocalArticles] 無法載入英文版本資料:', err);
        }
        
        // 使用動態 import 載入當前語言的 JSON
        let articlesData: any;
        try {
          articlesData = await import(`../i18n/locales/${locale}/articles.json`);
        } catch (err) {
          console.warn(`[useLocalArticles] 找不到 ${locale} 的文章資料，使用英文版本`);
          articlesData = enArticlesData;
        }

        if (!isMounted) return;

        // 轉換資料格式
        const enData = enArticlesData?.default || enArticlesData || {};
        const feedItems: FeedItem[] = Object.entries(articlesData.default || articlesData)
          .map(([id, data]) => {
            // 從英文版本取得 originalHeading
            const originalHeading = enData[id]?.heading;
            return transformLocalToFeedItem(id, data, originalHeading);
          })
          .sort((a, b) => a.id - b.id);

        // 更新 cache
        localArticlesCache = {
          items: feedItems,
          locale: i18n.language,
          timestamp: Date.now()
        };

        setItems(feedItems);
      } catch (err) {
        if (!isMounted) return;
        console.error('[useLocalArticles] 載入本地文章資料失敗:', err);
        setError(err as Error);
        // 如果有舊的 cache 資料，保留它而不是清空
        if (!localArticlesCache) {
          setItems([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadLocalArticles();

    return () => {
      isMounted = false;
    };
  }, [i18n.language]);

  return { items, loading, error };
}

