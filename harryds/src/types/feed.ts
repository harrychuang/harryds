// =============================================================================
// 共用 Feed 型別（供 FeedCard / FeedDetailOverlay / 外部資料來源使用）
// =============================================================================

export type FeedCategory = 'article' | 'project';

export interface FeedItem {
  id: number;
  heading: string;
  date: string;
  tags: string[];
  category: FeedCategory;
  brand?: string;
  primaryColor?: string;
  secondaryColor?: string;
  heroImage?: string; // 圖片 URL（可對應 PixelImage 的 src）
  content?: FeedContentBlock[] | string; // 文章內容：結構化方塊或純文字
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
  | { type: 'image'; src: string; alt?: string };

// Project Section（專案區塊，如 Scope, Impact, Get In Touch）
export interface ProjectSection {
  title: string;
  content: ProjectSectionContent[];
}

// Project 資訊（用於 FeedDetailOverlay 的專案資訊區塊）
export interface ProjectInfo {
  client?: string;
  project?: string;
  roles?: string[];
  description?: string;
  websiteUrl?: string;
  websiteLabel?: string;
  mainImage?: string; // 主圖片（description 下方的第一張圖）
  specialHeadingImage?: string; // 特殊主圖（右上角 parallax 效果的圖）
  sections?: ProjectSection[];
}


