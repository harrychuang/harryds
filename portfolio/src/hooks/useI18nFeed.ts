import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { FeedItem } from 'hds/types/feed';

// 使用 Vite 的 glob import 來預載所有圖片
const imageModules = import.meta.glob<{ default: string }>('@assets/imgs/**/*.{jpg,jpeg,png,gif,webp,svg}', { eager: true });

// 從 glob import 結果中解析圖片 URL
const resolveImageUrl = (path?: string): string | undefined => {
  if (!path) return undefined;
  try {
    // 方法 1: 直接查找完整路徑
    const fullPath = `@assets/imgs/${path}`;
    if (imageModules[fullPath]) {
      return imageModules[fullPath].default;
    }
    
    // 方法 2: 遍歷所有 keys 找到匹配的結尾
    for (const [key, module] of Object.entries(imageModules)) {
      if (key.endsWith(path) || key.endsWith(`/${path}`)) {
        return module.default;
      }
    }
    
    console.warn('[useI18nFeed] 找不到圖片:', path);
    return undefined;
  } catch (e) {
    console.warn('[useI18nFeed] 無法解析圖片:', path, e);
    return undefined;
  }
};

/**
 * 從 i18n 載入專案和文章資料的 Hook
 * 支援從 projects 和 articles namespace 載入資料
 */
export function useI18nFeed(namespace: 'projects' | 'articles' = 'projects') {
  const { t, i18n } = useTranslation(namespace);

  const items = useMemo(() => {
    // 從 i18n 獲取整個 namespace 的資料
    const data = i18n.getResourceBundle('en', namespace) as any;
    const itemIds = Object.keys(data || {})
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id))
      .sort((a, b) => a - b);
    
    console.log(`[useI18nFeed] 自動檢測到的 ${namespace} IDs:`, itemIds);
    
    return itemIds.map(id => {
      try {
        const itemKey = `${id}`;
        
        // 從當前語言獲取資料
        const item = t(itemKey, { returnObjects: true, ns: namespace }) as any;
        
        if (!item || typeof item !== 'object') {
          console.warn(`[useI18nFeed] ${namespace} ${id} 資料不存在`);
          return null;
        }

        // 從英文版本獲取配置資料（顏色、圖片等不需翻譯的內容）
        const enItem = t(itemKey, { returnObjects: true, lng: 'en', ns: namespace }) as any;

        // 構建完整的 FeedItem
        const feedItem: FeedItem = {
          id,
          heading: item.heading || item.subtitle || enItem.heading || enItem.subtitle,
          date: enItem.date || item.date, // 日期統一使用英文
          tags: enItem.tags || [],
          category: enItem.category || namespace === 'articles' ? 'article' : 'project',
          brand: enItem.brand,
          primaryColor: enItem.primaryColor,
          secondaryColor: enItem.secondaryColor,
          heroImage: resolveImageUrl(enItem.heroImage || (enItem.images && enItem.images[0])),
          // 保留原始英文 heading 用於 URL slug
          originalHeading: enItem.heading || enItem.subtitle,
          // Articles 的特殊欄位
          ...(namespace === 'articles' && {
            subtitle: item.subtitle,
            url: enItem.url,
            images: enItem.images,
            content: item.content
          }),
          // Projects 的 projectInfo
          projectInfo: item.projectInfo && enItem.projectInfo ? {
            project: item.projectInfo.project,
            roles: enItem.projectInfo.roles,
            meta: enItem.projectInfo.meta,
            description: item.projectInfo.description,
            websiteUrl: enItem.projectInfo.websiteUrl,
            websiteLabel: item.projectInfo.websiteLabel,
            mainImage: resolveImageUrl(enItem.projectInfo.mainImage),
            specialHeadingImage: resolveImageUrl(enItem.projectInfo.specialHeadingImage),
            sections: enItem.projectInfo.sections ? 
              Object.keys(enItem.projectInfo.sections).map(sectionKey => {
                const enSection = enItem.projectInfo.sections[sectionKey];
                const translatedSection = item.projectInfo?.sections?.[sectionKey];
                
                return {
                  title: translatedSection?.title || enSection.title,
                  content: (() => {
                    const contents: any[] = [];
                    
                    // 添加段落
                    let paragraphIdx = 1;
                    while (enSection[`paragraph${paragraphIdx}`]) {
                      contents.push({
                        type: 'paragraph',
                        text: translatedSection?.[`paragraph${paragraphIdx}`] || enSection[`paragraph${paragraphIdx}`]
                      });
                      paragraphIdx++;
                    }
                    
                    // 添加引用
                    let quoteIdx = 1;
                    while (enSection[`quote${quoteIdx}`]) {
                      contents.push({
                        type: 'quote',
                        text: translatedSection?.[`quote${quoteIdx}`] || enSection[`quote${quoteIdx}`]
                      });
                      quoteIdx++;
                    }
                    
                    // 添加 blockquote
                    if (enSection.blockquote) {
                      contents.push({
                        type: 'blockquote',
                        text: translatedSection?.blockquote || enSection.blockquote,
                        enableTypewriter: true
                      });
                    }
                    
                    // 添加圖片
                    let imageIdx = 1;
                    while (enSection[`image${imageIdx}`]) {
                      contents.push({
                        type: 'image',
                        src: resolveImageUrl(enSection[`image${imageIdx}`]) || enSection[`image${imageIdx}`],
                        alt: `${enSection.title} Image ${imageIdx}`
                      });
                      imageIdx++;
                    }
                    
                    return contents;
                  })()
                };
              }) : undefined
          } : undefined
        };

        return feedItem;
      } catch (error) {
        console.error(`[useI18nFeed] 載入 ${namespace} ${id} 時發生錯誤:`, error);
        return null;
      }
    }).filter((item): item is FeedItem => item !== null);
  }, [t, i18n.language, namespace]);

  return {
    items,
    loading: false,
    error: null
  };
}

