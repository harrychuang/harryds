import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// 預載本地資產
const imageModules = import.meta.glob<{ default: string }>(
  '../../assets/imgs/**/*.{jpg,jpeg,png,gif,webp,svg,mp4,webm}',
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

  console.warn('[useLocalCourses] 找不到本地圖片:', path);
  return undefined;
};

// 課程項目類型定義
export interface CourseItem {
  id: number;
  status?: 'active' | 'ended' | 'upcoming';
  heading: string;
  originalHeading: string;
  subtitle: string;
  instructor: string;
  date: string;
  tags: string[];
  category: string;
  level?: string;
  highlights?: string[];
  primaryColor?: string;
  secondaryColor?: string;
  heroImage?: string;
  images?: string[];
  valueProposition: {
    title: string;
    subtitle: string;
    audience: string;
    format: string;
  };
  usp: Array<{
    title: string;
    description: string;
  }>;
  syllabus: Array<{
    day: string;
    title: string;
    sessions: Array<{
      time: string;
      title?: string;
      content?: string;
      description?: string;
    }>;
    string;
  }>;
  projects: {
    shared: {
      title: string;
      description: string;
    };
    personal: {
      title: string;
      description: string;
    };
  };
  pricing: {
    schedule: string;
    location: string;
    earlyBird: string;
    original: string;
    note: string;
  };
  slidesEmbed?: string;
  faq: Array<{
    question: string;
    answer: string;
  }>;
  mentorship?: {
    title: string;
    description: string;
  };
  instructorBio?: {
    name: string;
    title: string;
    experience?: string[];
    teaching?: string[];
    codropsArticle?: string;
    codropsArticleText?: string;
  };
}

/**
 * 將本地 i18n 資料轉換為 CourseItem 格式
 */
const transformLocalToCourseItem = (id: string, data: any, enData?: any): CourseItem => {
  // 解析 images 陣列中的圖片路徑
  const images = (data.images || []).map((img: string) => resolveLocalImageUrl(img));
  
  return {
    id: parseInt(id),
    status: data.status || enData?.status,
    heading: data.heading || '',
    originalHeading: enData?.heading || data.heading || '',
    subtitle: data.subtitle || '',
    instructor: data.instructor || '',
    // 日期和 tags 始終使用英文版本，不隨語系變化
    date: enData?.date || data.date || '',
    tags: enData?.tags || data.tags || [],
    category: data.category || 'course',
    level: data.level || '',
    highlights: data.highlights || [],
    // 顏色優先使用英文版本（統一管理）
    primaryColor: enData?.primaryColor || data.primaryColor,
    secondaryColor: enData?.secondaryColor || data.secondaryColor,
    heroImage: images[0] || resolveLocalImageUrl(data.heroImage),
    images,
    valueProposition: data.valueProposition || {},
    usp: data.usp || [],
    syllabus: data.syllabus || [],
    projects: data.projects || {},
    pricing: data.pricing || {},
    slidesEmbed: data.slidesEmbed || '',
    faq: data.faq || [],
    mentorship: data.mentorship,
    instructorBio: data.instructorBio
  };
};

// ============================================================================
// Cache 機制 - 避免每次組件 mount 時重新載入資料
// ============================================================================
interface LocalCoursesCache {
  items: CourseItem[];
  locale: string;
  timestamp: number;
}

let localCoursesCache: LocalCoursesCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘快取有效期

/**
 * Hook: 從本地 i18n locales 取得課程資料
 * 包含 cache 機制，避免重複載入
 */
export function useLocalCourses() {
  const { i18n } = useTranslation();
  
  // 檢查是否有有效的 cache
  const hasValidCache = localCoursesCache && 
    localCoursesCache.locale === i18n.language &&
    (Date.now() - localCoursesCache.timestamp) < CACHE_DURATION;
  
  // 如果有有效 cache，初始值使用 cache 的資料，且 loading 為 false
  const [items, setItems] = useState<CourseItem[]>(hasValidCache ? localCoursesCache!.items : []);
  const [loading, setLoading] = useState(!hasValidCache);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLocalCourses() {
      // 如果有有效的 cache，跳過載入
      if (localCoursesCache && 
          localCoursesCache.locale === i18n.language &&
          (Date.now() - localCoursesCache.timestamp) < CACHE_DURATION) {
        if (isMounted) {
          setItems(localCoursesCache.items);
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
        
        // 根據當前語言載入對應的 courses.json
        const locale = i18n.language.startsWith('zh') ? 'zh-Hant' : i18n.language;
        
        // 首先載入英文版本以取得 originalHeading
        let enCoursesData: any;
        try {
          enCoursesData = await import(`../i18n/locales/en/courses.json`);
        } catch (err) {
          console.error('[useLocalCourses] 無法載入英文版本資料:', err);
        }
        
        // 使用動態 import 載入當前語言的 JSON
        let coursesData: any;
        try {
          coursesData = await import(`../i18n/locales/${locale}/courses.json`);
        } catch (err) {
          console.warn(`[useLocalCourses] 找不到 ${locale} 的課程資料，使用英文版本`);
          coursesData = enCoursesData;
        }

        if (!isMounted) return;

        // 轉換資料格式
        const enData = enCoursesData?.default || enCoursesData || {};
        const courseItems: CourseItem[] = Object.entries(coursesData.default || coursesData)
          .map(([id, data]) => {
            // 傳入英文版本資料，用於 originalHeading、tags 和 date
            return transformLocalToCourseItem(id, data, enData[id]);
          })
          .sort((a, b) => a.id - b.id);

        // 更新 cache
        localCoursesCache = {
          items: courseItems,
          locale: i18n.language,
          timestamp: Date.now()
        };

        setItems(courseItems);
      } catch (err) {
        if (!isMounted) return;
        console.error('[useLocalCourses] 載入本地課程資料失敗:', err);
        setError(err as Error);
        // 如果有舊的 cache 資料，保留它而不是清空
        if (!localCoursesCache) {
          setItems([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadLocalCourses();

    return () => {
      isMounted = false;
    };
  }, [i18n.language]);

  return { items, loading, error };
}
