import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { strapiClient } from '../services/strapiClient';
import type { FeedItem } from '../../../harryds/src/types/feed';

// 預載本地資產作為回退（當 Strapi 路徑是舊格式時使用）
const imageModules = import.meta.glob<{ default: string }>(
  '../../assets/imgs/**/*.{jpg,jpeg,png,gif,webp,svg,mp4,webm}',
  { eager: true }
);

interface StrapiArticle {
  id: number;
  attributes: {
    title: Record<string, string>;
    slug: string;
    subtitle: Record<string, string>;
    date: string;
    tags: string[];
    category: string;
    url: string;
    content: Record<string, any>;
    coverImage: {
      data: {
        id: number;
        attributes: {
          url: string;
          formats?: {
            large?: { url: string };
            medium?: { url: string };
            small?: { url: string };
          };
        };
      } | null;
    };
    images: {
      data: Array<{
        id: number;
        attributes: {
          url: string;
        };
      }> | null;
    };
  };
}

/**
 * 解析 Strapi 媒體 URL
 * 
 * 支援的格式：
 * 1. Strapi 媒體關聯: { data: { attributes: { url: '...' } } }
 * 2. Strapi 陣列項目: { id: ..., attributes: { url: '...' } }
 * 3. 直接 URL 字串: '/uploads/xxx.jpg' 或 'https://...'
 * 4. 舊的相對路徑: 'articles/00/topics-0.1.jpg'
 */
const resolveMediaUrl = (media?: any): string | undefined => {
  if (!media) return undefined;

  // 如果是字串，檢查是否為舊的相對路徑格式
  if (typeof media === 'string') {
    // 完整 URL 直接返回
    if (/^https?:\/\//i.test(media)) {
      return media;
    }
    
    // Strapi /uploads/ 路徑，使用 strapiClient 處理
    if (media.startsWith('/uploads') || media.startsWith('/strapi/uploads')) {
      return strapiClient.resolveMediaUrl(media);
    }
    
    // 舊的相對路徑格式（如 "articles/00/topics-0.1.jpg"）→ 從本地資產載入
    const normalized = media.replace(/^@assets\/imgs\//, '').replace(/^\/+/, '');
    const fullPath = `../../assets/imgs/${normalized}`;
    
    // 嘗試直接匹配
    if (imageModules[fullPath]) {
      return imageModules[fullPath].default;
    }
    
    // 嘗試模糊匹配（處理路徑差異）
    for (const [key, module] of Object.entries(imageModules)) {
      if (key.endsWith(normalized) || key.endsWith(`/${normalized}`)) {
        return module.default;
      }
    }
    
    // 如果本地找不到，嘗試用 Strapi URL 拼接
    console.warn(`[useStrapiArticles] 找不到本地圖片: ${media}`);
    return strapiClient.resolveMediaUrl(media);
  }

  // 處理 Strapi 媒體物件格式
  let rawUrl: string | undefined;
  
  // 格式 1: { data: { attributes: { url: '...' } } } - 單一媒體關聯
  if (media?.data?.attributes?.url) {
    rawUrl = media.data.attributes.url;
  }
  // 格式 2: { id: ..., attributes: { url: '...' } } - 媒體陣列項目
  else if (media?.attributes?.url) {
    rawUrl = media.attributes.url;
  }
  // 格式 3: { url: '...' } - 直接物件
  else if (media?.url) {
    rawUrl = media.url;
  }
  
  if (rawUrl) {
    return strapiClient.resolveMediaUrl(rawUrl);
  }
  
  return undefined;
};

/**
 * 將 Strapi 文章資料轉換為 FeedItem 格式
 */
function transformStrapiToFeedItem(article: StrapiArticle, locale: string): FeedItem {
  const attrs = article.attributes;
  
  // 取得當前語言的資料，如果不存在則回退到英文
  const currentLocale = locale === 'zh' ? 'zh-Hant' : locale;
  const fallbackLocale = 'en';
  
  const getLocalizedValue = (multiLangObj: Record<string, any>) => {
    return multiLangObj?.[currentLocale] || multiLangObj?.[fallbackLocale] || '';
  };

  // 取得 coverImage URL（支援 Strapi 媒體關聯）
  const heroImage = resolveMediaUrl(attrs.coverImage);
  
  // 取得英文版本的 title 作為 originalHeading
  const originalHeading = attrs.title?.['en'] || getLocalizedValue(attrs.title);

  // 取得 images 陣列
  const images = attrs.images?.data?.map(img => resolveMediaUrl(img)) || [];

  return {
    id: article.id,
    heading: getLocalizedValue(attrs.title),
    originalHeading,
    subtitle: getLocalizedValue(attrs.subtitle),
    date: attrs.date,
    tags: attrs.tags || [],
    category: attrs.category || 'article',
    url: attrs.url,
    heroImage: heroImage || (images.length > 0 ? images[0] : undefined),
    images,
    content: getLocalizedValue(attrs.content),
    // 保存原始的多語言資料供需要時使用
    _rawData: {
      title: attrs.title,
      subtitle: attrs.subtitle,
      content: attrs.content
    }
  } as FeedItem;
}

// ============================================================================
// Cache 機制 - 避免每次組件 mount 時重新請求資料
// ============================================================================
interface ArticlesCache {
  items: FeedItem[];
  locale: string;
  timestamp: number;
}

let articlesCache: ArticlesCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘快取有效期

/**
 * Hook: 從 Strapi 取得文章資料
 * 自動處理多語言，根據當前語言返回對應的資料
 * 包含 cache 機制，避免重複請求
 */
export function useStrapiArticles() {
  const { i18n } = useTranslation();
  
  // 檢查是否有有效的 cache
  const hasValidCache = articlesCache && 
    articlesCache.locale === i18n.language &&
    (Date.now() - articlesCache.timestamp) < CACHE_DURATION;
  
  // 如果有有效 cache，初始值使用 cache 的資料，且 loading 為 false
  const [items, setItems] = useState<FeedItem[]>(hasValidCache ? articlesCache!.items : []);
  const [loading, setLoading] = useState(!hasValidCache);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchArticles() {
      // 如果有有效的 cache，跳過請求
      if (articlesCache && 
          articlesCache.locale === i18n.language &&
          (Date.now() - articlesCache.timestamp) < CACHE_DURATION) {
        if (isMounted) {
          setItems(articlesCache.items);
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

        // 取得所有文章，並 populate 圖片
        const response = await strapiClient.getArticles({
          populate: '*',
          sort: 'id:asc'
        });

        if (!isMounted) return;

        // 轉換資料格式
        const feedItems = response.data.map((article: StrapiArticle) => 
          transformStrapiToFeedItem(article, i18n.language)
        );

        // 更新 cache
        articlesCache = {
          items: feedItems,
          locale: i18n.language,
          timestamp: Date.now()
        };

        setItems(feedItems);
      } catch (err) {
        if (!isMounted) return;
        console.error('[useStrapiArticles] 取得文章資料失敗:', err);
        setError(err as Error);
        // 如果有舊的 cache 資料，保留它而不是清空
        if (!articlesCache) {
          setItems([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchArticles();

    return () => {
      isMounted = false;
    };
  }, [i18n.language]); // 當語言切換時重新取得資料

  return { items, loading, error };
}

