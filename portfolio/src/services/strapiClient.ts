import type { FeedContentBlock, FeedItem, ProjectInfo, ProjectSection, ProjectSectionContent } from 'hds/types/feed';
import type {
  StrapiCollectionResponse,
  StrapiFeedBlock,
  StrapiFeedItemAttributes,
  StrapiMediaRelation,
  StrapiProjectInfo,
  StrapiProjectSection,
  StrapiProjectSectionContent,
} from '../types/strapi';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL as string | undefined;
console.log('[strapiClient] STRAPI_URL 設定:', STRAPI_URL || '未設定');

const joinUrl = (base: string, path: string) => {
  const b = base.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
};

export const normalizeAssetUrl = (url?: string | null): string => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url;
  if (!STRAPI_URL) {
    console.warn('[strapiClient] VITE_STRAPI_URL 未設定，圖片可能無法正確顯示。請設定環境變數。');
    return url; // 若未設定，直接回傳相對路徑
  }
  const fullUrl = joinUrl(STRAPI_URL, url);
  console.log(`[strapiClient] 圖片 URL 轉換: ${url} -> ${fullUrl}`);
  return fullUrl;
};

const resolveMediaUrl = (rel?: StrapiMediaRelation | any | null): string => {
  console.log('[resolveMediaUrl] 輸入的媒體關聯:', rel);
  
  // 處理不同的 Strapi 版本格式
  let raw: string | undefined;
  
  if (rel?.data?.attributes?.url) {
    // Strapi v4 格式: { data: { attributes: { url: '...' } } }
    raw = rel.data.attributes.url;
    console.log('[resolveMediaUrl] 使用 Strapi v4 格式');
  } else if (rel?.url) {
    // Strapi v5 或直接圖片物件格式: { id, url, documentId }
    raw = rel.url;
    console.log('[resolveMediaUrl] 使用 Strapi v5 或直接物件格式');
  } else if (typeof rel === 'string') {
    // 直接是字串 URL
    raw = rel;
    console.log('[resolveMediaUrl] 使用直接字串格式');
  }
  
  console.log('[resolveMediaUrl] 提取的原始 URL:', raw);
  const result = normalizeAssetUrl(raw ?? '');
  console.log('[resolveMediaUrl] 最終 URL:', result);
  return result;
};

const mapBlock = (block: StrapiFeedBlock): FeedContentBlock | null => {
  console.log('[strapiClient] 處理區塊:', block.__component, block);

  switch (block.__component) {
    case 'feed.heading':
      return { 
        type: 'heading', 
        level: (block as any).level ?? 1, 
        content: (block as any).content 
      };
    case 'feed.paragraph':
      // 若 paragraph 來自 Blocks，將其轉為純文字段落
      {
        const content = (block as any).content;
        if (Array.isArray(content)) {
          const text = content.flatMap((node: any) => {
            if (node?.type === 'paragraph' && Array.isArray(node.children)) {
              return node.children.map((c: any) => (typeof c.text === 'string' ? c.text : ''));
            }
            return [];
          }).join('');
          return { type: 'paragraph', content: text } as FeedContentBlock;
        }
        return { type: 'paragraph', content: content } as FeedContentBlock;
      }
    case 'feed.image':
      return { 
        type: 'image', 
        src: resolveMediaUrl((block as any).image), 
        alt: (block as any).alt ?? undefined 
      };
    case 'feed.video':
      const videoSrc = resolveMediaUrl((block as any).video);
      const posterSrc = (block as any).poster ? resolveMediaUrl((block as any).poster) : undefined;
      
      console.log('[strapiClient] Video 區塊處理:', {
        originalVideo: (block as any).video,
        resolvedSrc: videoSrc,
        originalPoster: (block as any).poster,
        resolvedPoster: posterSrc,
        alt: (block as any).alt,
        autoplay: (block as any).autoplay,
        loop: (block as any).loop,
        muted: (block as any).muted,
        controls: (block as any).controls
      });
      
      return { 
        type: 'video', 
        src: videoSrc, 
        poster: posterSrc,
        alt: (block as any).alt ?? undefined,
        autoplay: (block as any).autoplay ?? false,
        loop: (block as any).loop ?? false,
        muted: (block as any).muted ?? true,
        controls: (block as any).controls ?? true
      };
    case 'feed.list':
      return { 
        type: 'list', 
        items: Array.isArray((block as any).items) ? (block as any).items : [] 
      };
    default:
      console.warn('[strapiClient] 未知的區塊類型:', block);
      return null;
  }
};

// 映射 Project Section Content
const mapProjectSectionContent = (content: StrapiProjectSectionContent): ProjectSectionContent | null => {
  console.log('[strapiClient] 處理 Project Section Content:', content.__component, content);

  switch (content.__component) {
    case 'project.paragraph':
      return {
        type: 'paragraph',
        text: content.text || ''
      };
    case 'project.quote':
      return {
        type: 'quote',
        text: content.text || ''
      };
    case 'project.blockquote':
      return {
        type: 'blockquote',
        text: content.text || '',
        enableTypewriter: content.enableTypewriter ?? false
      };
    case 'project.image':
      return {
        type: 'image',
        src: resolveMediaUrl(content.image),
        alt: content.alt ?? undefined
      };
    default:
      console.warn('[strapiClient] 未知的 Project Section Content 類型:', content);
      return null;
  }
};

// 映射 Project Section
const mapProjectSection = (section: StrapiProjectSection): ProjectSection | null => {
  console.log('[strapiClient] 處理 Project Section:', section);

  if (!section.title) {
    console.warn('[strapiClient] Project Section 缺少 title');
    return null;
  }

  const mappedContent = section.content
    ? section.content.map(mapProjectSectionContent).filter((c): c is ProjectSectionContent => c !== null)
    : [];

  return {
    title: section.title,
    content: mappedContent
  };
};

// 映射 Project Info
const mapProjectInfo = (projectInfo: StrapiProjectInfo | null | undefined): ProjectInfo | undefined => {
  if (!projectInfo) return undefined;

  console.log('[strapiClient] 處理 Project Info:', projectInfo);

  const mappedSections = projectInfo.sections
    ? projectInfo.sections.map(mapProjectSection).filter((s): s is ProjectSection => s !== null)
    : [];

  return {
    client: projectInfo.client ?? undefined,
    project: projectInfo.project ?? undefined,
    roles: projectInfo.roles ?? undefined,
    description: projectInfo.description ?? undefined,
    websiteUrl: projectInfo.websiteUrl ?? undefined,
    websiteLabel: projectInfo.websiteLabel ?? undefined,
    mainImage: projectInfo.mainImage ? resolveMediaUrl(projectInfo.mainImage) : undefined,
    specialHeadingImage: projectInfo.specialHeadingImage ? resolveMediaUrl(projectInfo.specialHeadingImage) : undefined,
    sections: mappedSections.length > 0 ? mappedSections : undefined
  };
};

const mapFeedItem = (entity: any): FeedItem => {
  console.log('[mapFeedItem] 處理項目:', entity.id, entity.heading || entity.attributes?.heading);
  // Strapi v5 直接返回字段，不包裝在 attributes 中
  const data = entity.attributes || entity; // 兼容 v4/v5 格式
  console.log('[mapFeedItem] 項目資料:', { 
    hasHeroImage: !!data.heroImage, 
    heroImageStructure: data.heroImage,
    hasProjectInfo: !!data.projectInfo
  });
  
  const rawBlocks = Array.isArray(data.content) ? data.content.map(mapBlock).filter(Boolean) as FeedContentBlock[] : undefined;
  const projectInfo = mapProjectInfo(data.projectInfo);
  
  // 直接使用 Strapi 的圖片 URL，不使用備用圖片
  const heroImageUrl = resolveMediaUrl(data.heroImage ?? undefined);
  console.log('[mapFeedItem] 項目', entity.id, '最終圖片 URL:', heroImageUrl);
  console.log('[mapFeedItem] 項目', entity.id, 'Project Info:', projectInfo);
  
  return {
    id: entity.id,
    heading: data.heading,
    date: data.date,
    tags: Array.isArray(data.tags) ? data.tags : [],
    category: data.category,
    brand: data.brand ?? undefined,
    primaryColor: data.primaryColor ?? undefined,
    secondaryColor: data.secondaryColor ?? undefined,
    heroImage: heroImageUrl, // 只使用 Strapi 的圖片，沒有圖片時為空字串
    content: rawBlocks,
    projectInfo: projectInfo, // 新增 projectInfo
  };
};

export async function fetchFeedItemsFromStrapi(): Promise<FeedItem[]> {
  if (!STRAPI_URL) throw new Error('VITE_STRAPI_URL 未設定');
  const url = new URL(joinUrl(STRAPI_URL, '/api/feed-items'));
  // Strapi v5: 精準 populate，避免觸發非法鍵（如 heroImage.related）
  url.searchParams.set('populate[heroImage][fields][0]', 'url');
  url.searchParams.set('populate[heroImage][fields][1]', 'alternativeText');
  // 動態區塊：populate 所有組件，包括 image 中的 media 關聯
  url.searchParams.set('populate[content][populate]', '*');
  // ProjectInfo: populate 所有欄位和嵌套關聯
  url.searchParams.set('populate[projectInfo][populate][mainImage][fields][0]', 'url');
  url.searchParams.set('populate[projectInfo][populate][specialHeadingImage][fields][0]', 'url');
  url.searchParams.set('populate[projectInfo][populate][sections][populate]', '*');
  // articleBody 為 Rich text (Blocks)，不需額外 populate
  url.searchParams.set('pagination[pageSize]', '100');
  // 只取已發布內容
  url.searchParams.set('publicationState', 'live');
  // 現已禁用國際化，locale=all 不再需要但保持兼容性
  url.searchParams.set('ts', String(Date.now()));

  try {
    const res = await fetch(url.toString(), { headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) {
      const text = await res.text();
      const err = new Error(`Strapi 請求失敗: HTTP ${res.status} ${res.statusText} — ${url.toString()} — ${text.slice(0, 180)}`);
      (err as any).status = res.status;
      (err as any).url = url.toString();
      throw err;
    }
    const json = await res.json();
    return (json.data || []).map(mapFeedItem);
  } catch (e: any) {
    console.error('[Strapi] fetchFeedItemsFromStrapi error:', e?.message || e, { url: url.toString() });
    throw e;
  }
}


