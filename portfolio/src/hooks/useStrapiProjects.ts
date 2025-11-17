import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { strapiClient } from '../services/strapiClient';
import type { FeedItem, ProjectInfo, ProjectSection, ProjectSectionContent } from '../types/feed';

// 預載本地資產，便於解析 i18n 匯入時保留的相對路徑圖片
const imageModules = import.meta.glob<{ default: string }>(
  '@assets/imgs/**/*.{jpg,jpeg,png,gif,webp,svg}',
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

const resolveImageUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;

  // Strapi 上的完整 URL 或 uploads 相對路徑
  if (/^https?:\/\//i.test(path) || path.startsWith('/uploads') || path.startsWith('/strapi/uploads')) {
    return strapiClient.resolveMediaUrl(path);
  }

  // 嘗試對應到本地資產（與 i18n feed 相同的目錄結構）
  const normalized = path.replace(/^@assets\/imgs\//, '').replace(/^\/+/, '');
  const fullPath = `@assets/imgs/${normalized}`;

  if (imageModules[fullPath]) {
    return imageModules[fullPath].default;
  }

  for (const [key, module] of Object.entries(imageModules)) {
    if (key.endsWith(normalized) || key.endsWith(`/${normalized}`)) {
      return module.default;
    }
  }

  // 最後回退用 Strapi baseURL 拼接
  return strapiClient.resolveMediaUrl(path);
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

    let imageIdx = 1;
    while (section[`image${imageIdx}`]) {
      contents.push({
        type: 'image',
        src: resolveImageUrl(section[`image${imageIdx}`]) || '',
        alt: `${section.title || key} Image ${imageIdx}`
      });
      imageIdx++;
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
    mainImage: resolveImageUrl(content.mainImage),
    specialHeadingImage: resolveImageUrl(content.specialHeadingImage),
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

  // 取得 coverImage URL
  const coverImageUrl = attrs.coverImage?.data?.attributes?.url || '';
  const heroImage = resolveImageUrl(coverImageUrl);
  const projectInfo = mapProjectInfo(attrs, locale);

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
