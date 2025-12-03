import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { strapiClient } from '../services/strapiClient';
import type { FeedItem, ProjectInfo, ProjectSection, ProjectSectionContent } from '../../../harryds/src/types/feed';

// 預載本地資產作為回退（當 Strapi 路徑是舊格式時使用）
const imageModules = import.meta.glob<{ default: string }>(
  '../../assets/imgs/**/*.{jpg,jpeg,png,gif,webp,svg,mp4,webm}',
  { eager: true }
);

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
 * 解析 Strapi 媒體 URL（支援圖片和影片）
 * 
 * 支援的格式：
 * 1. Strapi 媒體關聯物件: { data: { attributes: { url: '...' } } } (v4)
 * 2. Strapi 媒體物件: { url: '...', id: ..., documentId: '...' } (v5)
 * 3. 直接的 URL 字串: '/uploads/xxx.jpg' 或 'https://...'
 * 4. 舊的相對路徑字串: 'demo/noein/xxx.jpg' → 從本地資產載入
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
    
    // 舊的相對路徑格式（如 "demo/noein/xxx.jpg"）→ 從本地資產載入
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
    
    // 如果本地找不到，嘗試用 Strapi URL 拼接（作為最後的回退）
    console.warn(`[useStrapiProjects] 找不到本地圖片: ${media}`);
    return strapiClient.resolveMediaUrl(media);
  }

  // 處理 Strapi 媒體關聯物件
  const url = strapiClient.resolveMediaUrl(media);
  return url || undefined;
};

const mapSections = (sectionsObj?: Record<string, any>): ProjectSection[] | undefined => {
  if (!sectionsObj || typeof sectionsObj !== 'object') return undefined;

  const sections: ProjectSection[] = [];

  for (const key of Object.keys(sectionsObj)) {
    const section = sectionsObj[key] || {};
    const contents: ProjectSectionContent[] = [];

    let paragraphIdx = 1;
    while (section[`paragraph${paragraphIdx}`]) {
      contents.push({
        type: 'paragraph',
        text: section[`paragraph${paragraphIdx}`]
      });
      paragraphIdx++;
    }

    let quoteIdx = 1;
    while (section[`quote${quoteIdx}`]) {
      contents.push({
        type: 'quote',
        text: section[`quote${quoteIdx}`]
      });
      quoteIdx++;
    }

    if (section.blockquote) {
      contents.push({
        type: 'blockquote',
        text: section.blockquote,
        enableTypewriter: true
      });
    }

    // 處理圖片
    let imageIdx = 1;
    while (section[`image${imageIdx}`]) {
      contents.push({
        type: 'image',
        src: resolveMediaUrl(section[`image${imageIdx}`]) || '',
        alt: `${section.title || key} Image ${imageIdx}`
      });
      imageIdx++;
    }

    // 處理影片
    let videoIdx = 1;
    while (section[`video${videoIdx}`]) {
      const videoData = section[`video${videoIdx}`];
      // 影片可以是字串 URL 或 Strapi 媒體物件
      const videoSrc = typeof videoData === 'string' 
        ? resolveMediaUrl(videoData) 
        : resolveMediaUrl(videoData?.src || videoData);
      const posterSrc = typeof videoData === 'object' && videoData?.poster 
        ? resolveMediaUrl(videoData.poster) 
        : undefined;
      
      if (videoSrc) {
        contents.push({
          type: 'video',
          src: videoSrc,
          poster: posterSrc,
          alt: `${section.title || key} Video ${videoIdx}`,
          autoplay: videoData?.autoplay ?? false,
          loop: videoData?.loop ?? true,
          muted: videoData?.muted ?? true,
          controls: videoData?.controls ?? true
        } as ProjectSectionContent);
      }
      videoIdx++;
    }

    sections.push({
      title: section.title || key,
      content: contents
    });
  }

  return sections.length > 0 ? sections : undefined;
};

const mapProjectInfo = (attrs: StrapiProject['attributes'], locale: string): ProjectInfo | undefined => {
  const currentLocale = locale === 'zh' ? 'zh-Hant' : locale;
  const fallbackLocale = 'en';
  const getLocalizedValue = (multiLangObj: Record<string, any>) => {
    return multiLangObj?.[currentLocale] || multiLangObj?.[fallbackLocale] || '';
  };

  const content = getLocalizedValue(attrs.content) || {};
  const description = getLocalizedValue(attrs.description);
  const meta = getLocalizedValue(attrs.meta);

  return {
    project: content.project,
    roles: content.roles || [],
    description: description || content.description,
    websiteUrl: content.websiteUrl,
    websiteLabel: content.websiteLabel,
    mainImage: resolveMediaUrl(content.mainImage),
    specialHeadingImage: resolveMediaUrl(content.specialHeadingImage),
    meta: Array.isArray(meta) ? meta : undefined,
    sections: mapSections(content.sections)
  };
};

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

  // 取得 coverImage URL（支援 Strapi 媒體關聯）
  const heroImage = resolveMediaUrl(attrs.coverImage);
  const projectInfo = mapProjectInfo(attrs, locale);

  // 取得英文版本的 title 作為 originalHeading，用於生成一致的 URL slug
  const originalHeading = attrs.title?.['en'] || getLocalizedValue(attrs.title);

  return {
    id: project.id,
    heading: getLocalizedValue(attrs.title),
    originalHeading, // 保存英文 heading 用於生成 URL slug
    date: attrs.date,
    tags: attrs.tags || [],
    category: attrs.categories?.[0] || 'project',
    brand: attrs.brand,
    primaryColor: attrs.primaryColor,
    secondaryColor: attrs.secondaryColor,
    heroImage: heroImage,
    projectInfo,
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

        // 取得所有專案，並 populate 圖片
        const response = await strapiClient.getProjects({
          populate: '*',
          sort: 'id:asc'
        });

        if (!isMounted) return;

        // 轉換資料格式
        const feedItems = response.data.map((project: StrapiProject) => 
          transformStrapiToFeedItem(project, i18n.language)
        );

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
