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
        const fromStrapi = await fetchFeedItemsFromStrapi();
        if (!mounted) return;
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


