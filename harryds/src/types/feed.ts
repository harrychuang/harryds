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
}

export type FeedContentBlock =
  | { type: 'heading'; level?: 1 | 2 | 3; content: string }
  | { type: 'paragraph'; content: string }
  | { type: 'image'; src: string; alt?: string }
  | { type: 'video'; src: string; poster?: string; alt?: string; autoplay?: boolean; loop?: boolean; muted?: boolean; controls?: boolean }
  | { type: 'list'; items: string[] };

// Project 資訊（用於 FeedDetailOverlay 的專案資訊區塊）
export interface ProjectInfo {
  client?: string;
  roles?: string[];
  description?: string;
  websiteUrl?: string;
  websiteLabel?: string;
}


