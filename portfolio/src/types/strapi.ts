// 基本 Strapi v4 Response 型別
export interface StrapiMetaPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface StrapiResponseMeta {
  pagination?: StrapiMetaPagination;
}

export interface StrapiUploadFileAttributes {
  url: string;
  alternativeText?: string | null;
  caption?: string | null;
  name?: string;
  width?: number | null;
  height?: number | null;
}

export interface StrapiEntity<TAttributes> {
  id: number;
  attributes: TAttributes;
}

export interface StrapiCollectionResponse<TAttributes> {
  data: Array<StrapiEntity<TAttributes>>;
  meta: StrapiResponseMeta;
}

export interface StrapiSingleResponse<TAttributes> {
  data: StrapiEntity<TAttributes> | null;
  meta: StrapiResponseMeta;
}

export interface StrapiMediaRelation {
  data: null | {
    id: number;
    attributes: StrapiUploadFileAttributes;
  };
}

// Feed 動態區塊（與前端 FeedContentBlock 對應）
export type StrapiFeedBlockHeading = {
  __component: 'feed.heading';
  level?: 1 | 2 | 3;
  content: string;
};

export type StrapiFeedBlockParagraph = {
  __component: 'feed.paragraph';
  content: string;
};

export type StrapiFeedBlockImage = {
  __component: 'feed.image';
  image: StrapiMediaRelation;
  alt?: string;
};

export type StrapiFeedBlockList = {
  __component: 'feed.list';
  items: string[];
};

export type StrapiFeedBlockVideo = {
  __component: 'feed.video';
  video: StrapiMediaRelation;
  poster?: StrapiMediaRelation;
  alt?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
};

export type StrapiFeedBlock =
  | StrapiFeedBlockHeading
  | StrapiFeedBlockParagraph
  | StrapiFeedBlockImage
  | StrapiFeedBlockList
  | StrapiFeedBlockVideo;

// Project Section Content（對應 feed.json 的 ProjectSectionContent）
export type StrapiProjectSectionContent = {
  __component: 'project.paragraph' | 'project.quote' | 'project.blockquote' | 'project.image';
  text?: string;
  src?: string;
  alt?: string;
  image?: StrapiMediaRelation;
  enableTypewriter?: boolean;
};

// Project Section（對應 feed.json 的 ProjectSection）
export type StrapiProjectSection = {
  __component: 'project.section';
  title: string;
  content?: StrapiProjectSectionContent[];
};

// Project Info（對應 feed.json 的 ProjectInfo）
export interface StrapiProjectInfo {
  client?: string | null;
  project?: string | null;
  roles?: string[] | null;
  description?: string | null;
  websiteUrl?: string | null;
  websiteLabel?: string | null;
  mainImage?: StrapiMediaRelation | null;
  specialHeadingImage?: StrapiMediaRelation | null;
  sections?: StrapiProjectSection[] | null;
}

// FeedItem 對應的 Attributes
export interface StrapiFeedItemAttributes {
  heading: string;
  date: string;
  tags?: string[]; // 建議用 JSON 或 repeatable component 轉成 string[]
  category: 'article' | 'project';
  brand?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  heroImage?: StrapiMediaRelation | null;
  content?: StrapiFeedBlock[] | null; // dynamic zone（用於文章內容）
  projectInfo?: StrapiProjectInfo | null; // 專案資訊（用於專案類型）
}


