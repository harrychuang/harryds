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
 * 從 i18n 載入專案資料的 Hook
 * 所有專案資料（文字、顏色、圖片）統一在 i18n 中管理
 */
export function useI18nFeed() {
  const { t, i18n } = useTranslation();

  const items = useMemo(() => {
    const projectIds = [1, 2, 3, 4, 5, 6, 7];
    
    return projectIds.map(id => {
      try {
        const projectKey = `projects.${id}`;
        
        // 從當前語言獲取專案資料
        const project = t(projectKey, { returnObjects: true }) as any;
        
        if (!project || typeof project !== 'object') {
          console.warn(`[useI18nFeed] 專案 ${id} 資料不存在`);
          return null;
        }

        // 從英文版本獲取配置資料（顏色、圖片等不需翻譯的內容）
        const enProject = t(projectKey, { returnObjects: true, lng: 'en' }) as any;

        // 構建完整的 FeedItem
        const feedItem: FeedItem = {
          id,
          heading: project.heading || enProject.heading,
          date: enProject.date, // 日期統一使用英文
          tags: enProject.tags || [],
          category: enProject.category || 'project',
          brand: enProject.brand,
          primaryColor: enProject.primaryColor,
          secondaryColor: enProject.secondaryColor,
          heroImage: resolveImageUrl(enProject.heroImage),
          // 保留原始英文 heading 用於 URL slug
          originalHeading: enProject.heading,
          projectInfo: project.projectInfo && enProject.projectInfo ? {
            project: project.projectInfo.project,
            roles: enProject.projectInfo.roles,
            meta: enProject.projectInfo.meta,
            description: project.projectInfo.description,
            websiteUrl: enProject.projectInfo.websiteUrl,
            websiteLabel: project.projectInfo.websiteLabel,
            mainImage: resolveImageUrl(enProject.projectInfo.mainImage),
            specialHeadingImage: resolveImageUrl(enProject.projectInfo.specialHeadingImage),
            sections: enProject.projectInfo.sections ? 
              Object.keys(enProject.projectInfo.sections).map(sectionKey => {
                const enSection = enProject.projectInfo.sections[sectionKey];
                const translatedSection = project.projectInfo?.sections?.[sectionKey];
                
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
        console.error(`[useI18nFeed] 載入專案 ${id} 時發生錯誤:`, error);
        return null;
      }
    }).filter((item): item is FeedItem => item !== null);
  }, [t, i18n.language]);

  return {
    items,
    loading: false,
    error: null
  };
}

