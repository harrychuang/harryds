/**
 * Google Analytics 事件追蹤工具
 * GA4 Measurement ID: G-ETF3ND0HLB
 */

// 宣告 gtag 函數類型
declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config' | 'js',
      action: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

/**
 * 通用事件追蹤函數
 */
const trackEvent = (
  eventName: string,
  params?: Record<string, unknown>
): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};

// ============================================================================
// 📁 Project 相關事件
// ============================================================================

/**
 * 追蹤專案瀏覽
 */
export const trackProjectView = (
  projectId: number,
  projectName: string,
  category?: string
): void => {
  trackEvent('view_project', {
    project_id: projectId,
    project_name: projectName,
    category: category || 'uncategorized',
  });
};

/**
 * 追蹤私人專案解鎖
 */
export const trackPrivateProjectUnlock = (
  projectId: number,
  projectName: string
): void => {
  trackEvent('unlock_private_project', {
    project_id: projectId,
    project_name: projectName,
  });
};

// ============================================================================
// 📝 Article 相關事件
// ============================================================================

/**
 * 追蹤文章瀏覽
 */
export const trackArticleView = (
  articleId: number,
  articleTitle: string,
  topics?: string[]
): void => {
  trackEvent('view_article', {
    article_id: articleId,
    article_title: articleTitle,
    topics: topics?.join(', ') || '',
  });
};

/**
 * 追蹤相關文章點擊
 */
export const trackRelatedArticleClick = (
  sourceArticleId: number,
  targetArticleId: number,
  targetArticleTitle: string
): void => {
  trackEvent('click_related_article', {
    source_article_id: sourceArticleId,
    target_article_id: targetArticleId,
    target_article_title: targetArticleTitle,
  });
};

/**
 * 追蹤 Topic 標籤點擊
 */
export const trackTopicClick = (
  topic: string,
  source: 'articles_page' | 'article_detail'
): void => {
  trackEvent('click_topic', {
    topic_name: topic,
    source_page: source,
  });
};

// ============================================================================
// 💼 轉換目標事件
// ============================================================================

/**
 * 追蹤聯絡 Modal 打開（重要轉換指標）
 */
export const trackContactOpen = (
  source: 'header' | 'footer' | 'project_detail' | 'about'
): void => {
  trackEvent('open_contact', {
    source_location: source,
  });
};

/**
 * 追蹤 Like/Heart 點擊
 */
export const trackLike = (
  pagePath: string,
  action: 'like' | 'unlike'
): void => {
  trackEvent('toggle_like', {
    page_path: pagePath,
    action: action,
  });
};

// ============================================================================
// ⚙️ 用戶偏好設定事件
// ============================================================================

/**
 * 追蹤語言切換
 */
export const trackLanguageChange = (
  fromLang: string,
  toLang: string
): void => {
  trackEvent('change_language', {
    from_language: fromLang,
    to_language: toLang,
  });
};

/**
 * 追蹤主題切換
 */
export const trackThemeChange = (
  theme: 'light' | 'dark'
): void => {
  trackEvent('change_theme', {
    theme: theme,
  });
};

/**
 * 追蹤音效切換
 */
export const trackSoundToggle = (
  enabled: boolean
): void => {
  trackEvent('toggle_sound', {
    sound_enabled: enabled,
  });
};

// ============================================================================
// 🖼️ 內容互動事件
// ============================================================================

/**
 * 追蹤圖片輪播操作
 */
export const trackCarouselInteraction = (
  articleId: number,
  action: 'prev' | 'next' | 'dot_click' | 'drag',
  imageIndex: number,
  totalImages: number
): void => {
  trackEvent('carousel_interaction', {
    article_id: articleId,
    action: action,
    image_index: imageIndex,
    total_images: totalImages,
  });
};

/**
 * 追蹤外部連結點擊
 */
export const trackExternalLinkClick = (
  url: string,
  linkText: string,
  source: string
): void => {
  trackEvent('click_external_link', {
    link_url: url,
    link_text: linkText,
    source_page: source,
  });
};

// ============================================================================
// 📊 頁面瀏覽追蹤（SPA 路由變化）
// ============================================================================

/**
 * 追蹤虛擬頁面瀏覽（用於 SPA 路由變化）
 */
export const trackPageView = (
  pagePath: string,
  pageTitle?: string
): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-ETF3ND0HLB', {
      page_path: pagePath,
      page_title: pageTitle,
    });
  }
};

export default {
  trackProjectView,
  trackPrivateProjectUnlock,
  trackArticleView,
  trackRelatedArticleClick,
  trackTopicClick,
  trackContactOpen,
  trackLike,
  trackLanguageChange,
  trackThemeChange,
  trackSoundToggle,
  trackCarouselInteraction,
  trackExternalLinkClick,
  trackPageView,
};

