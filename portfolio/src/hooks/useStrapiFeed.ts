import { useEffect, useMemo, useState } from 'react';
import type { FeedItem } from 'hds/types/feed';
import { fetchFeedItemsFromStrapi } from '../services/strapiClient';
import feedData from '../../../shared/data/feed.json';

// 使用 Vite 的 glob import 來預載所有圖片
const imageModules = import.meta.glob<{ default: string }>('@assets/imgs/**/*.{jpg,jpeg,png,gif,webp,svg}', { eager: true });

// Fallback 資料：如果 Strapi 沒有資料或資料不完整，使用 feed.json
const getFallbackData = (): FeedItem[] => {
  console.log('[useStrapiFeed] 使用 fallback 資料 (feed.json)');
  console.log('[useStrapiFeed] 已載入的圖片模組:', Object.keys(imageModules));
  
  // 從 glob import 結果中解析圖片 URL
  const resolveImageUrl = (path?: string): string | undefined => {
    if (!path) return undefined;
    try {
      // glob import 的 key 可能是相對路徑，我們需要匹配 path 的結尾
      // 例如：key 可能是 "@assets/imgs/demo/demo-shopmatic-01.jpg"
      // 而 path 是 "demo/demo-shopmatic-01.jpg"
      
      // 方法 1: 直接查找完整路徑
      const fullPath = `@assets/imgs/${path}`;
      if (imageModules[fullPath]) {
        const imageUrl = imageModules[fullPath].default;
        console.log('[useStrapiFeed] 解析圖片 (完整路徑):', path, '->', imageUrl);
        return imageUrl;
      }
      
      // 方法 2: 遍歷所有 keys 找到匹配的結尾
      for (const [key, module] of Object.entries(imageModules)) {
        if (key.endsWith(path) || key.endsWith(`/${path}`)) {
          const imageUrl = module.default;
          console.log('[useStrapiFeed] 解析圖片 (結尾匹配):', path, 'key:', key, '->', imageUrl);
          return imageUrl;
        }
      }
      
      console.warn('[useStrapiFeed] 找不到圖片:', path);
      console.warn('[useStrapiFeed] 可用的圖片 keys:', Object.keys(imageModules).slice(0, 5));
      return undefined;
    } catch (e) {
      console.warn('[useStrapiFeed] 無法解析圖片:', path, e);
      return undefined;
    }
  };
  
  return feedData.items.map((item: any) => ({
    ...item,
    heroImage: resolveImageUrl(item.heroImage),
    // 解析 projectInfo 中的圖片
    projectInfo: item.projectInfo ? {
      ...item.projectInfo,
      mainImage: resolveImageUrl(item.projectInfo.mainImage),
      specialHeadingImage: resolveImageUrl(item.projectInfo.specialHeadingImage),
      // 解析 sections 中的圖片
      sections: item.projectInfo.sections?.map((section: any) => ({
        ...section,
        content: section.content?.map((content: any) => {
          if (content.type === 'image' && content.src) {
            return {
              ...content,
              src: resolveImageUrl(content.src)
            };
          }
          return content;
        })
      }))
    } : undefined
  }));
};

export function useStrapiFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        console.log('[useStrapiFeed] 開始從 Strapi 獲取資料...');
        const fromStrapi = await fetchFeedItemsFromStrapi();
        if (!mounted) return;
        console.log('[useStrapiFeed] 成功獲取資料:', fromStrapi.length, '筆項目');
        
        // 檢查資料是否完整（有 heroImage 和 projectInfo）
        const hasCompleteData = fromStrapi.length > 0 && 
          fromStrapi.some(item => item.heroImage || item.projectInfo);
        
        if (hasCompleteData) {
          console.log('[useStrapiFeed] 使用 Strapi 資料');
          console.log('[useStrapiFeed] 第一個項目:', fromStrapi[0]);
          setItems(fromStrapi);
          setError(null);
        } else {
          console.warn('[useStrapiFeed] Strapi 資料不完整，使用 fallback 資料');
          const fallbackData = getFallbackData();
          setItems(fallbackData);
          setError('Strapi 資料不完整，使用測試資料');
        }
      } catch (e: any) {
        console.error('[useStrapiFeed] 無法從 Strapi 獲取資料:', e?.message || e);
        if (!mounted) return;
        // Strapi 連線失敗時使用 fallback
        const fallbackData = getFallbackData();
        setItems(fallbackData);
        setError(e?.message || 'Strapi 無法連線，使用測試資料');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const value = useMemo(() => ({ items, loading, error }), [items, loading, error]);
  return value;
}


