import { useEffect, useMemo, useState } from 'react';
import type { FeedItem } from 'hds/types/feed';
import { fetchFeedItemsFromStrapi } from '../services/strapiClient';

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
        console.log('[useStrapiFeed] 第一個項目的圖片:', fromStrapi[0]?.heroImage);
        setItems(fromStrapi);
        setError(null);
      } catch (e: any) {
        console.error('[useStrapiFeed] 無法從 Strapi 獲取資料:', e?.message || e);
        if (!mounted) return;
        setItems([]); // 設為空陣列而不是使用假資料
        setError(e?.message || 'Strapi 無法連線');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const value = useMemo(() => ({ items, loading, error }), [items, loading, error]);
  return value;
}


