// =============================================================================
// FEED CARD INFO 元件
// - 顯示：二進位編號 (PixelText) / 標題 / 日期 / 標籤 (PixelText text-box)
// =============================================================================

import { forwardRef, useContext, useMemo, memo, useState, useEffect, useRef } from 'react';
import { PixelText } from '../PixelText';
import PixelText2D from '../PixelText/PixelText2D';
import { CHAR_WIDTH, CHAR_HEIGHT } from '../PixelText';
import './FeedCardInfo.scss';
import type { FeedCardSize } from './FeedCard';
import { FeedCardHoverContext, FeedCardSizeContext } from './FeedCard';
import { HDS_TOKENS } from '../../utils/colorTokens';

// 避免 hover 切換時重繪昂貴的 PixelText 畫布
const StablePixelText = memo(PixelText);
const StablePixelText2D = memo(PixelText2D);

export interface FeedCardInfoProps {
  /** 尺寸（可選）：決定多個區塊的預設像素大小與標題字級。若不提供，會自動從父層 FeedCard 的 size context 中獲取，最終預設為 'hero' */
  size?: FeedCardSize;

  /** JSON 資料物件（建議使用）：id, heading, date, tags, category */
  data?: FeedCardInfoData;

  /** 由父層 FeedCard 傳入的 hover 狀態 */
  hovered?: boolean;

  /** 主色：hover 時的文字色（ID/日期/標題）與標籤框背景色 */
  primaryColor?: string;
  /** 次色：hover 時標籤框文字色 */
  secondaryColor?: string;
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
  med:  { id: 3, headingPx: 80,  date: 2, tags: 2 },
  sm:   { id: 2, headingPx: 46,  date: 1, tags: 1 },
  xs:   { id: 1, headingPx: 30,  date: 1, tags: 1 },
};

export const FeedCardInfo = forwardRef<HTMLDivElement, FeedCardInfoProps>(({ 
  size,
  data,
  hovered,
  primaryColor = HDS_TOKENS.themeSurface,
  secondaryColor = HDS_TOKENS.onThemeSurface,
}, ref) => {
  const hoveredFromContext = useContext(FeedCardHoverContext);
  const sizeFromContext = useContext(FeedCardSizeContext);
  const isHovered = hovered ?? hoveredFromContext ?? false;
  const computedSize = size ?? sizeFromContext ?? 'hero';
  // 非 hover 預設顏色（使用 tokens，以利 dark 模式反轉）
  const basePrimary = 'var(--hds-sys-color-theme-surface)';
  const baseSecondary = 'var(--on-hds-sys-color-theme-surface)';
  const computedIndex = data?.id ?? 0;
  const computedHeading = data?.heading ?? '';
  const computedDateRange = data?.date ?? '';
  const computedTags = data?.tags ?? [];

  // 打字動畫狀態
  const [displayedChars, setDisplayedChars] = useState(0);
  const [flashingCharIndex, setFlashingCharIndex] = useState(-1);
  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 打字動畫效果
  useEffect(() => {
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
    }
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
    }

    if (isHovered && computedHeading) {
      // hover 時啟動打字動畫
      setDisplayedChars(0);
      setFlashingCharIndex(-1);
      
      const typeCharacter = (charIndex: number) => {
        if (charIndex <= computedHeading.length) {
          setDisplayedChars(charIndex);
          
          // 如果是新字符，觸發閃爍效果
          if (charIndex > 0 && charIndex <= computedHeading.length) {
            setFlashingCharIndex(charIndex - 1);
            // 200ms 後停止閃爍
            flashTimeoutRef.current = setTimeout(() => {
              setFlashingCharIndex(-1);
            }, 200);
          }
          
          if (charIndex < computedHeading.length) {
            typewriterTimeoutRef.current = setTimeout(() => typeCharacter(charIndex + 1), 30);
          }
        }
      };
      
      typeCharacter(0);
    } else {
      // 非 hover 時立即顯示完整文字
      setDisplayedChars(computedHeading.length);
      setFlashingCharIndex(-1);
    }

    return () => {
      if (typewriterTimeoutRef.current) {
        clearTimeout(typewriterTimeoutRef.current);
      }
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, [isHovered, computedHeading]);

  // 顯示的文字內容
  const displayedHeading = isHovered ? computedHeading.slice(0, displayedChars) : computedHeading;

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
      .join('  ');
  }, [computedTags]);
  const sizePreset = SIZE_PRESETS[computedSize];

  const idPx = sizePreset.id;
  const datePx = sizePreset.date;
  const tagsPx = sizePreset.tags;
  const headingPx = sizePreset.headingPx;

  // 內部固定預設（簡化 API）
  const pixelGap = 0;
  const tagsTextBoxPadding = 5;
  const letterSpacing = 1;

  // PixelText 尺寸計算
  const idCanvas = useMemo(() => computeTextCanvasSize(idText, idPx, pixelGap, letterSpacing), [idText, idPx, pixelGap, letterSpacing]);
  const idCanvasHover = useMemo(() => computeTextCanvasSize(idText, idPx, 2, letterSpacing), [idText, idPx, letterSpacing]);
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
    <div ref={ref} className={`feed-card-info size-${computedSize}`.trim()}>
      <div className="feed-card-info__id">
        <div className="fade-stack" style={{ width: isHovered ? idCanvasHover.width : idCanvas.width, height: isHovered ? idCanvasHover.height : idCanvas.height }}>
          <div className="fade-layer base" style={{ opacity: isHovered ? 0 : 1 }}>
            <StablePixelText2D
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
            <StablePixelText2D
              text={idText}
              textEnabled
              pixelSize={idPx}
              pixelGap={2}
              letterSpacing={letterSpacing}
              primaryColor={primaryColor}
              width={idCanvasHover.width}
              height={idCanvasHover.height}
              animated={isHovered}
              totalAnimationDuration={500}
            />
          </div>
        </div>
      </div>

      <div className="feed-card-info__heading" style={{ fontSize: isHovered ? headingPx * 1.2 : headingPx, color: isHovered ? primaryColor : basePrimary, transition: 'color 300ms ease, font-size 200ms ease' }}>
        {isHovered ? (
          <>
            {Array.from(displayedHeading).map((char, index) => (
              <span
                key={index}
                style={{
                  opacity: flashingCharIndex === index ? 0.1 : 1,
                  transition: 'opacity 60ms ease',
                }}
              >
                {char}
              </span>
            ))}
            {displayedChars < computedHeading.length && (
              <span 
                style={{ 
                  animation: 'cursor-blink 1s infinite', 
                  marginLeft: '2px',
                  fontSize: 'inherit',
                  color: 'inherit'
                }}
              >
                _
              </span>
            )}
          </>
        ) : (
          displayedHeading
        )}
      </div>
      <div className="feed-card-info__date">
        <div className="fade-stack" style={{ width: dateCanvas.width, height: dateCanvas.height }}>
          <div className="fade-layer base" style={{ opacity: isHovered ? 0 : 1 }}>
            <StablePixelText2D
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
            <StablePixelText2D
              text={computedDateRange}
              textEnabled
              pixelSize={datePx}
              pixelGap={pixelGap}
              letterSpacing={letterSpacing}
              primaryColor={primaryColor}
              width={dateCanvas.width}
              height={dateCanvas.height}
              animated={isHovered}
              totalAnimationDuration={500}
            />
          </div>
        </div>
      </div>

      <div className="feed-card-info__tags">
        <div className="fade-stack" style={{ width: tagCanvas.width, height: tagCanvas.height }}>
          <div className="fade-layer base" style={{ opacity: isHovered ? 0 : 1 }}>
            <StablePixelText2D
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
            <StablePixelText2D
              text=""
              textEnabled={false}
              textBoxEnabled
              textBox={tagsDisplayText}
              textBoxWidth={textBoxWidth}
              textBoxPadding={tagsTextBoxPadding}
              pixelSize={tagsPx}
              pixelGap={pixelGap}
              letterSpacing={letterSpacing}
              primaryColor={primaryColor}
              onPrimaryColor={secondaryColor}
              width={tagCanvas.width}
              height={tagCanvas.height}
              spaceWidth={3}
              animated={isHovered}
              totalAnimationDuration={500}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

FeedCardInfo.displayName = 'FeedCardInfo';

export default FeedCardInfo;


