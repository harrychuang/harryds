import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { FeedItem } from '../../../harryds/src/types/feed';

// 預載本地資產
const imageModules = import.meta.glob<{ default: string }>(
  '../../assets/imgs/**/*.{jpg,jpeg,png,gif,webp,svg}',
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

  console.warn('[useLocalProjects] 找不到本地圖片:', path);
  return undefined;
};

/**
 * 將本地 i18n 資料轉換為 FeedItem 格式
 */
const transformLocalToFeedItem = (id: string, data: any, originalHeading?: string): FeedItem => {
  return {
    id: parseInt(id),
    heading: data.heading || '',
    originalHeading: originalHeading || data.heading || '', // 保存原始英文 heading 用於生成一致的 URL
    date: data.date || '',
    tags: data.tags || [],
    category: data.category || 'project',
    brand: data.brand,
    primaryColor: data.primaryColor,
    secondaryColor: data.secondaryColor,
    heroImage: resolveLocalImageUrl(data.heroImage),
    projectInfo: data.projectInfo ? {
      client: data.projectInfo.client,
      project: data.projectInfo.project,
      roles: data.projectInfo.roles,
      description: data.projectInfo.description,
      websiteUrl: data.projectInfo.websiteUrl,
      websiteLabel: data.projectInfo.websiteLabel,
      mainImage: resolveLocalImageUrl(data.projectInfo.mainImage),
      specialHeadingImage: resolveLocalImageUrl(data.projectInfo.specialHeadingImage),
      meta: data.projectInfo.meta,
      sections: data.projectInfo.sections ? Object.entries(data.projectInfo.sections).map(([key, section]: [string, any]) => {
        const contents = [];
        
        // 處理 paragraph
        let paragraphIdx = 1;
        while (section[`paragraph${paragraphIdx}`]) {
          contents.push({
            type: 'paragraph' as const,
            text: section[`paragraph${paragraphIdx}`]
          });
          paragraphIdx++;
        }
        
        // 處理 quote
        let quoteIdx = 1;
        while (section[`quote${quoteIdx}`]) {
          contents.push({
            type: 'quote' as const,
            text: section[`quote${quoteIdx}`]
          });
          quoteIdx++;
        }
        
        // 處理 blockquote
        if (section.blockquote) {
          contents.push({
            type: 'blockquote' as const,
            text: section.blockquote,
            enableTypewriter: true
          });
        }
        
        // 處理 image
        let imageIdx = 1;
        while (section[`image${imageIdx}`]) {
          contents.push({
            type: 'image' as const,
            src: resolveLocalImageUrl(section[`image${imageIdx}`]) || '',
            alt: `${section.title || key} Image ${imageIdx}`
          });
          imageIdx++;
        }
        
        return {
          title: section.title || key,
          content: contents
        };
      }) : undefined
    } : undefined
  };
};

/**
 * Hook: 從本地 i18n locales 取得專案資料
 */
export function useLocalProjects() {
  const { i18n } = useTranslation();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLocalProjects() {
      try {
        setLoading(true);
        setError(null);

        console.log('[useLocalProjects] 開始載入本地專案資料...');
        
        // 根據當前語言載入對應的 projects.json
        const locale = i18n.language === 'zh' ? 'zh-Hant' : i18n.language;
        
        // 首先載入英文版本以取得 originalHeading
        let enProjectsData: any;
        try {
          enProjectsData = await import(`../i18n/locales/en/projects.json`);
        } catch (err) {
          console.error('[useLocalProjects] 無法載入英文版本資料:', err);
        }
        
        // 使用動態 import 載入當前語言的 JSON
        let projectsData: any;
        try {
          // 嘗試載入指定語言的資料
          projectsData = await import(`../i18n/locales/${locale}/projects.json`);
        } catch (err) {
          console.warn(`[useLocalProjects] 找不到 ${locale} 的專案資料，使用英文版本`);
          projectsData = enProjectsData;
        }

        if (!isMounted) return;

        // 轉換資料格式
        const enData = enProjectsData?.default || enProjectsData || {};
        const feedItems: FeedItem[] = Object.entries(projectsData.default || projectsData)
          .map(([id, data]) => {
            // 從英文版本取得 originalHeading，用於生成一致的 URL slug
            const originalHeading = enData[id]?.heading;
            return transformLocalToFeedItem(id, data, originalHeading);
          })
          .sort((a, b) => a.id - b.id); // 按 ID 排序

        console.log('[useLocalProjects] 載入完成，項目數:', feedItems.length);
        console.log('[useLocalProjects] 第一個項目:', feedItems[0]);

        setItems(feedItems);
      } catch (err) {
        if (!isMounted) return;
        console.error('[useLocalProjects] 載入本地專案資料失敗:', err);
        setError(err as Error);
        setItems([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadLocalProjects();

    return () => {
      isMounted = false;
    };
  }, [i18n.language]); // 當語言切換時重新載入資料

  return { items, loading, error };
}

