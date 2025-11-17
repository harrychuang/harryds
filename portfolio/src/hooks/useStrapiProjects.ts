import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { strapiClient } from '../services/strapiClient';
import type { FeedItem } from '../types/feed';

interface StrapiProject {
  id: number;
  attributes: {
    title: Record<string, string>;
    slug: string;
    description: Record<string, string>;
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
    date: string;
    tags: string[];
    categories: string[];
    brand: string;
    primaryColor: string;
    secondaryColor: string;
    meta: Record<string, any[]>;
    content: Record<string, any>;
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
 * 將 Strapi 專案資料轉換為 FeedItem 格式
 */
function transformStrapiToFeedItem(project: StrapiProject, locale: string): FeedItem {
  const attrs = project.attributes;
  
  // 取得當前語言的資料，如果不存在則回退到英文
  const currentLocale = locale === 'zh' ? 'zh-Hant' : locale;
  const fallbackLocale = 'en';
  
  const getLocalizedValue = (multiLangObj: Record<string, any>) => {
    return multiLangObj?.[currentLocale] || multiLangObj?.[fallbackLocale] || '';
  };

  // 取得 coverImage URL
  const coverImageUrl = attrs.coverImage?.data?.attributes?.url || '';
  const heroImage = strapiClient.resolveMediaUrl(coverImageUrl);

  return {
    id: project.id,
    heading: getLocalizedValue(attrs.title),
    date: attrs.date,
    tags: attrs.tags || [],
    category: attrs.categories?.[0] || 'project',
    brand: attrs.brand,
    primaryColor: attrs.primaryColor,
    secondaryColor: attrs.secondaryColor,
    heroImage: heroImage,
    projectInfo: getLocalizedValue(attrs.content),
    // 保存原始的多語言資料供需要時使用
    _rawData: {
      title: attrs.title,
      description: attrs.description,
      meta: attrs.meta,
      content: attrs.content
    }
  } as FeedItem;
}

/**
 * Hook: 從 Strapi 取得專案資料
 * 自動處理多語言，根據當前語言返回對應的資料
 */
export function useStrapiProjects() {
  const { i18n } = useTranslation();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchProjects() {
      try {
        setLoading(true);
        setError(null);

        console.log('[useStrapiProjects] 開始取得專案資料...');

        // 取得所有專案，並 populate 圖片
        const response = await strapiClient.getProjects({
          populate: '*',
          sort: 'id:asc'
        });

        console.log('[useStrapiProjects] API 回應:', response);

        if (!isMounted) return;

        // 轉換資料格式
        const feedItems = response.data.map((project: StrapiProject) => 
          transformStrapiToFeedItem(project, i18n.language)
        );

        console.log('[useStrapiProjects] 轉換後的資料:', feedItems);

        setItems(feedItems);
      } catch (err) {
        if (!isMounted) return;
        console.error('[useStrapiProjects] 取得專案資料失敗:', err);
        setError(err as Error);
        setItems([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchProjects();

    return () => {
      isMounted = false;
    };
  }, [i18n.language]); // 當語言切換時重新取得資料

  return { items, loading, error };
}

