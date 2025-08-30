// =============================================================================
// FEED CARD INFO 元件
// - 顯示：二進位編號 (PixelText) / 標題 / 日期 / 標籤 (PixelText text-box)
// =============================================================================

import { CSSProperties, forwardRef, useContext, useMemo, memo } from 'react';
import { PixelText } from '../PixelText';
import { CHAR_WIDTH, CHAR_HEIGHT } from '../PixelText';
import './FeedCardInfo.scss';
import type { FeedCardSize } from './FeedCard';
import { FeedCardHoverContext } from './FeedCard';

// 避免 hover 切換時重繪昂貴的 PixelText 畫布
const StablePixelText = memo(PixelText);

export interface FeedCardInfoProps {
  /** 數字索引，將以 8 位二進位顯示，例如 1 -> 00000001（改為建議使用 data.id） */
  index?: number;
  /** 標題（Heading）（改為建議使用 data.heading） */
  heading?: string;
  /** 日期區間字串，例如：July 24, 2025 - June 25, 2026（改為建議使用 data.date） */
  dateRange?: string;
  /** 標籤字串陣列（改為建議使用 data.tags） */
  tags?: string[];
  /** 尺寸（預設 hero）：決定多個區塊的預設像素大小與標題字級 */
  size?: FeedCardSize;

  /** JSON 資料物件（建議使用）：id, heading, date, tags, category */
  data?: FeedCardInfoData;

  /** 由父層 FeedCard 傳入的 hover 狀態 */
  hovered?: boolean;

  /** 額外類名 */
  className?: string;
  /** 內聯樣式 */
  style?: CSSProperties;

  /** PixelText 視覺設定（可選） */
  pixelGap?: number; // 所有 PixelText 共用 gap
  letterSpacing?: number; // 所有 PixelText 共用字距
  /** 二進位顏色（文字） */
  idColor?: string;
  /** 日期顏色（文字） */
  dateColor?: string;
  /** 標題顏色（文字） */
  headingColor?: string;
  /** 標籤框主色（背景） */
  tagPrimaryColor?: string;
  /** 標籤框文字顏色 */
  tagOnPrimaryColor?: string;

  /** 覆寫單一區塊像素大小（非必要） */
  idPixelSize?: number;
  datePixelSize?: number;
  tagsPixelSize?: number;
  headingFontSize?: number; // px

  /** 標籤 text-box 的 padding（以 pixelSize 倍數），同時影響畫布尺寸與 PixelText */
  tagsTextBoxPadding?: number;
}

export interface FeedCardInfoData {
  /** 數字型 id，會顯示為 8 位二進位 */
  id: number;
  /** 標題 */
  heading: string;
  /** 日期（字串） */
  date: string;
  /** 標籤列表 */
  tags: string[];
  /** 類別：article / project（預設 project） */
  category?: 'article' | 'project';
}

const padTo8Bits = (n: number): string => {
  const clamped = Math.max(0, Math.floor(n));
  const binary = clamped.toString(2).slice(-8);
  return binary.padStart(8, '0');
};

const computeTextCanvasSize = (
  text: string,
  pixelSize: number,
  pixelGap: number,
  letterSpacing: number,
  spaceWidth: number = 2,
) => {
  const pixelWithGap = pixelSize + pixelGap;
  // 單列 8px 高度
  const height = CHAR_HEIGHT * pixelWithGap - pixelGap;

  // 計算字串的像素寬度（與 PixelText 一致的策略）
  const getCharWidth = (char: string) => {
    if (char === ' ') return letterSpacing * spaceWidth * pixelSize;
    return CHAR_WIDTH * pixelWithGap - pixelGap;
  };

  let width = 0;
  Array.from(text).forEach((char, index) => {
    width += getCharWidth(char);
    if (index < text.length - 1) {
      width += letterSpacing * pixelSize;
    }
  });

  return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) };
};

const computeTextBoxCanvasSize = (
  boxCharCount: number,
  pixelSize: number,
  pixelGap: number,
  letterSpacing: number,
  textBoxPadding: number,
) => {
  const pixelWithGap = pixelSize + pixelGap;
  // 容量寬度（不考慮內容長度，依 textBoxWidth 決定）
  const contentWidth = boxCharCount * CHAR_WIDTH * pixelWithGap - boxCharCount * pixelGap;
  const contentSpacing = Math.max(0, boxCharCount - 1) * letterSpacing * pixelSize;
  const totalContentWidth = contentWidth + contentSpacing;

  const leftPadding = textBoxPadding * pixelSize;
  const rightPadding = Math.max(0, textBoxPadding * pixelSize - pixelSize);
  const width = totalContentWidth + leftPadding + rightPadding;

  // 高度：一列字高 + 上下 padding（底部少一個像素）
  const topPadding = textBoxPadding * pixelSize;
  const bottomPadding = Math.max(0, textBoxPadding * pixelSize - pixelSize);
  const textPixelHeight = CHAR_HEIGHT * pixelWithGap - pixelGap;
  const height = textPixelHeight + topPadding + bottomPadding;

  return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) };
};

const SIZE_PRESETS: Record<FeedCardSize, { id: number; headingPx: number; date: number; tags: number }> = {
  hero: { id: 4, headingPx: 120, date: 3, tags: 2 },
  med:  { id: 4, headingPx: 80,  date: 3, tags: 2 },
  sm:   { id: 2, headingPx: 46,  date: 2, tags: 1 },
  xs:   { id: 1, headingPx: 30,  date: 1, tags: 1 },
};

export const FeedCardInfo = forwardRef<HTMLDivElement, FeedCardInfoProps>(({ 
  index,
  heading,
  dateRange,
  tags,
  size = 'hero',
  data,
  hovered,
  className = '',
  style,
  pixelGap = 0,
  letterSpacing = 1,
  idColor = '#000000',
  dateColor = '#000000',
  headingColor = '#000000',
  tagPrimaryColor = '#000000',
  tagOnPrimaryColor = '#FFFFFF',
  idPixelSize,
  datePixelSize,
  tagsPixelSize,
  headingFontSize,
  tagsTextBoxPadding = 5,
}, ref) => {
  const hoveredFromContext = useContext(FeedCardHoverContext);
  const isHovered = hovered ?? hoveredFromContext ?? false;
  // 非 hover 預設顏色
  const basePrimary = '#111111';
  const baseSecondary = '#FFFFFF';
  const computedIndex = data?.id ?? (typeof index === 'number' ? index : 0);
  const computedHeading = data?.heading ?? (heading ?? '');
  const computedDateRange = data?.date ?? (dateRange ?? '');
  const computedTags = data?.tags ?? (Array.isArray(tags) ? tags : []);

  const idText = useMemo(() => padTo8Bits(computedIndex), [computedIndex]);
  // 將標籤映射為「符號 + 原文字」，並以單一空白分隔各組
  const TAG_SYMBOL_MAP: Record<string, string> = {
    'UI': '▲',
    'UX': '●',
    'DEV': '◆',
    'ARTICLE': '+',
    'DESIGN SYSTEM': '◼',
  };
  const tagsDisplayText = useMemo(() => {
    const list = Array.isArray(computedTags) ? computedTags : [];
    return list
      .map((original) => {
        const key = original.trim().toUpperCase();
        const symbol = TAG_SYMBOL_MAP[key] || '';
        return symbol ? `${symbol} ${original}` : original;
      })
      .join('/');
  }, [computedTags]);
  const sizePreset = SIZE_PRESETS[size];

  const idPx = idPixelSize ?? sizePreset.id;
  const datePx = datePixelSize ?? sizePreset.date;
  const tagsPx = tagsPixelSize ?? sizePreset.tags;
  const headingPx = headingFontSize ?? sizePreset.headingPx;

  // PixelText 尺寸計算
  const idCanvas = useMemo(() => computeTextCanvasSize(idText, idPx, pixelGap, letterSpacing), [idText, idPx, pixelGap, letterSpacing]);
  const dateCanvas = useMemo(() => computeTextCanvasSize(computedDateRange, datePx, pixelGap, letterSpacing), [computedDateRange, datePx, pixelGap, letterSpacing]);
  // text-box 以內容長度作為 box 寬度容量，避免裁切；最少 6 個字元寬
  const textBoxWidth = Math.max(6, tagsDisplayText.length);
  const tagCanvas = useMemo(() => (
    computeTextBoxCanvasSize(
      textBoxWidth,
      tagsPx,
      pixelGap,
      letterSpacing,
      tagsTextBoxPadding,
    )
  ), [textBoxWidth, tagsPx, pixelGap, letterSpacing, tagsTextBoxPadding]);

  return (
    <div ref={ref} className={`feed-card-info size-${size} ${className}`.trim()} style={style}>
      <div className="feed-card-info__id">
        <div className="fade-stack" style={{ width: idCanvas.width, height: idCanvas.height }}>
          <div className="fade-layer base" style={{ opacity: isHovered ? 0 : 1 }}>
            <StablePixelText
              text={idText}
              textEnabled
              pixelSize={idPx}
              pixelGap={pixelGap}
              letterSpacing={letterSpacing}
              primaryColor={basePrimary}
              width={idCanvas.width}
              height={idCanvas.height}
              animated={false}
            />
          </div>
          <div className="fade-layer hover" style={{ opacity: isHovered ? 1 : 0 }}>
            <StablePixelText
              text={idText}
              textEnabled
              pixelSize={idPx}
              pixelGap={pixelGap}
              letterSpacing={letterSpacing}
              primaryColor={idColor}
              width={idCanvas.width}
              height={idCanvas.height}
              animated={isHovered}
              totalAnimationDuration={500}
            />
          </div>
        </div>
      </div>

      <div className="feed-card-info__heading" style={{ fontSize: headingPx, color: isHovered ? headingColor : basePrimary, transition: 'color 300ms ease' }}>
        {computedHeading}
      </div>
      <div className="feed-card-info__date">
        <div className="fade-stack" style={{ width: dateCanvas.width, height: dateCanvas.height }}>
          <div className="fade-layer base" style={{ opacity: isHovered ? 0 : 1 }}>
            <StablePixelText
              text={computedDateRange}
              textEnabled
              pixelSize={datePx}
              pixelGap={pixelGap}
              letterSpacing={letterSpacing}
              primaryColor={basePrimary}
              width={dateCanvas.width}
              height={dateCanvas.height}
              animated={false}
            />
          </div>
          <div className="fade-layer hover" style={{ opacity: isHovered ? 1 : 0 }}>
            <StablePixelText
              text={computedDateRange}
              textEnabled
              pixelSize={datePx}
              pixelGap={pixelGap}
              letterSpacing={letterSpacing}
              primaryColor={dateColor}
              width={dateCanvas.width}
              height={dateCanvas.height}
              animated={false}
            />
          </div>
        </div>
      </div>

      <div className="feed-card-info__tags">
        <div className="fade-stack" style={{ width: tagCanvas.width, height: tagCanvas.height }}>
          <div className="fade-layer base" style={{ opacity: isHovered ? 0 : 1 }}>
            <StablePixelText
              text=""
              textEnabled={false}
              textBoxEnabled
              textBox={tagsDisplayText}
              textBoxWidth={textBoxWidth}
              textBoxPadding={tagsTextBoxPadding}
              pixelSize={tagsPx}
              pixelGap={pixelGap}
              letterSpacing={letterSpacing}
              primaryColor={basePrimary}
              onPrimaryColor={baseSecondary}
              width={tagCanvas.width}
              height={tagCanvas.height}
              spaceWidth={3}
            />
          </div>
          <div className="fade-layer hover" style={{ opacity: isHovered ? 1 : 0 }}>
            <StablePixelText
              text=""
              textEnabled={false}
              textBoxEnabled
              textBox={tagsDisplayText}
              textBoxWidth={textBoxWidth}
              textBoxPadding={tagsTextBoxPadding}
              pixelSize={tagsPx}
              pixelGap={pixelGap}
              letterSpacing={letterSpacing}
              primaryColor={tagPrimaryColor}
              onPrimaryColor={tagOnPrimaryColor}
              width={tagCanvas.width}
              height={tagCanvas.height}
              spaceWidth={3}
              animated={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

FeedCardInfo.displayName = 'FeedCardInfo';

export default FeedCardInfo;


