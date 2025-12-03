// =============================================================================
// 共用 Feed 型別（供 FeedCard / FeedDetailOverlay / 外部資料來源使用）
// =============================================================================

export type FeedCategory = 'article' | 'project';

export interface FeedItem {
  id: number;
  heading: string;
  originalHeading?: string; // 原始英文 heading，用於生成 URL slug（確保多語言一致性）
  subtitle?: string; // 副標題（可選）
  date: string;
  tags: string[];
  category: FeedCategory;
  brand?: string;
  primaryColor?: string;
  secondaryColor?: string;
  heroImage?: string; // 圖片 URL（可對應 PixelationImg 的 src）
  images?: string[]; // 文章圖片陣列（用於文章類型的輪播）
  url?: string; // 外部連結 URL（用於文章類型）
  content?: FeedContentBlock[] | string | Record<string, any>; // 文章內容：結構化方塊、純文字或多語言物件
  projectInfo?: ProjectInfo; // 專案資訊（用於專案類型）
}

export type FeedContentBlock =
  | { type: 'heading'; level?: 1 | 2 | 3; content: string }
  | { type: 'paragraph'; content: string }
  | { type: 'image'; src: string; alt?: string }
  | { type: 'video'; src: string; poster?: string; alt?: string; autoplay?: boolean; loop?: boolean; muted?: boolean; controls?: boolean }
  | { type: 'list'; items: string[] };

// Project Section Content（區塊內容類型）
export type ProjectSectionContent =
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'blockquote'; text: string; enableTypewriter?: boolean }
  | { type: 'image'; src: string; alt?: string }
  | { type: 'video'; src: string; poster?: string; alt?: string; autoplay?: boolean; loop?: boolean; muted?: boolean; controls?: boolean };

// Project Section（專案區塊，如 Scope, Impact, Get In Touch）
export interface ProjectSection {
  title: string;
  content: ProjectSectionContent[];
}

// Project 資訊（用於 FeedDetailOverlay 的專案資訊區塊）
// 自訂專案中繼資料（可配置的標籤與值）
export interface ProjectMetaItem {
  label: string;
  value: string | string[];
}

export interface ProjectInfo {
  /**
   * 品牌名稱。
   * 備註：原先的 client 與 brand 含義一致，現統一以 brand 命名。
   * 若同時存在，應優先使用 brand。
   */
  brand?: string;
  /**
   * 已廢止：請改用 brand。
   */
  client?: string;
  project?: string;
  roles?: string[];
  description?: string;
  websiteUrl?: string;
  websiteLabel?: string;
  mainImage?: string; // 主圖片（description 下方的第一張圖）
  specialHeadingImage?: string; // 特殊主圖（右上角 parallax 效果的圖）
  /**
   * 自訂的 meta 陣列，若提供則 FeedDetailOverlay 優先使用此結構渲染標籤與內容。
   * 若未提供，則會回退使用 brand/project/roles 三種欄位渲染（brand 優先於 client）。
   */
  meta?: ProjectMetaItem[];
  sections?: ProjectSection[];
}


