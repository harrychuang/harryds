import type { FeedContentBlock, FeedItem } from 'hds/types/feed';
import type {
  StrapiCollectionResponse,
  StrapiFeedBlock,
  StrapiFeedItemAttributes,
  StrapiMediaRelation,
} from '../types/strapi';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL as string | undefined;

const joinUrl = (base: string, path: string) => {
  const b = base.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
};

export const normalizeAssetUrl = (url?: string | null): string => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url;
  if (!STRAPI_URL) return url; // 若未設定，直接回傳相對路徑
  return joinUrl(STRAPI_URL, url);
};

const resolveMediaUrl = (rel?: StrapiMediaRelation | null): string => {
  const raw = rel?.data?.attributes?.url;
  return normalizeAssetUrl(raw ?? '');
};

const mapBlock = (block: StrapiFeedBlock): FeedContentBlock | null => {
  switch (block.__component) {
    case 'feed.heading':
      return { type: 'heading', level: (block as any).level ?? 1, content: (block as any).content };
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
      return { type: 'image', src: resolveMediaUrl((block as any).image), alt: (block as any).alt ?? undefined };
    case 'feed.list':
      return { type: 'list', items: Array.isArray((block as any).items) ? (block as any).items : [] };
    default:
      return null;
  }
};

const mapFeedItem = (entity: { id: number; attributes: StrapiFeedItemAttributes }): FeedItem => {
  const a = entity.attributes;
  const rawBlocks = Array.isArray(a.content) ? a.content.map(mapBlock).filter(Boolean) as FeedContentBlock[] : undefined;
  return {
    id: entity.id,
    heading: a.heading,
    date: a.date,
    tags: Array.isArray(a.tags) ? a.tags : [],
    category: a.category,
    brand: a.brand ?? undefined,
    primaryColor: a.primaryColor ?? undefined,
    secondaryColor: a.secondaryColor ?? undefined,
    heroImage: resolveMediaUrl(a.heroImage ?? undefined),
    content: rawBlocks,
  };
};

export async function fetchFeedItemsFromStrapi(): Promise<FeedItem[]> {
  if (!STRAPI_URL) throw new Error('VITE_STRAPI_URL 未設定');
  const url = new URL(joinUrl(STRAPI_URL, '/api/feed-items'));
  // Strapi v5: 精準 populate，避免觸發非法鍵（如 heroImage.related）
  url.searchParams.set('populate[heroImage][fields][0]', 'url');
  url.searchParams.set('populate[heroImage][fields][1]', 'alternativeText');
  // 動態區塊：只對 feed.image 的 image 取 url
  url.searchParams.set('populate[content][on][feed.image][populate][image][fields][0]', 'url');
  // articleBody 為 Rich text (Blocks)，不需額外 populate
  url.searchParams.set('pagination[pageSize]', '100');
  // 只取已發布內容，並抓取所有語系；加 ts 參數避免快取
  url.searchParams.set('publicationState', 'live');
  url.searchParams.set('locale', 'all');
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
    const json = await res.json() as StrapiCollectionResponse<StrapiFeedItemAttributes>;
    return (json.data || []).map(mapFeedItem);
  } catch (e: any) {
    console.error('[Strapi] fetchFeedItemsFromStrapi error:', e?.message || e, { url: url.toString() });
    throw e;
  }
}


