import { useEffect, useMemo, useState } from 'react';
import type { FeedItem } from 'hds/types/feed';
import localFeed from 'shared/data/feed.json';
import { fetchFeedItemsFromStrapi } from '../services/strapiClient';

type Source = 'strapi' | 'local';

export function useStrapiFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<Source>('strapi');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const fromStrapi = await fetchFeedItemsFromStrapi();
        if (!mounted) return;
        setItems(fromStrapi);
        setSource('strapi');
      } catch (e: any) {
        console.warn('[useStrapiFeed] 使用本地資料作為後備:', e?.message || e);
        if (!mounted) return;
        const localItems = (localFeed as any).items as FeedItem[];
        setItems(localItems);
        setSource('local');
        setError(e?.message || 'Strapi 無法連線，已使用本地資料');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const value = useMemo(() => ({ items, loading, error, source }), [items, loading, error, source]);
  return value;
}


