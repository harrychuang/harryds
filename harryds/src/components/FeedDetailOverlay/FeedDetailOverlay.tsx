// =============================================================================
// FEED DETAIL OVERLAY 元件
// - 關閉/初始狀態：外觀與 FeedCard 相同（包覆並自動 fit）
// - 開啟後：固定於視窗（fixed, top:0, left:0），內含 FeedCard 作為 hero（高度 75vh）
// - hero 下方顯示文章內容（文字 + 圖片，預設內容或結構化 blocks）
// =============================================================================

import React, { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { FeedCard } from '../FeedCard';
import type { FeedCardProps } from '../FeedCard';
import type { FeedCardSize } from '../FeedCard/FeedCard';
import { FeedCardInfo } from '../FeedCard';
import type { FeedCardInfoData } from '../FeedCard';
import type { FeedContentBlock } from '../../types/feed';
import './FeedDetailOverlay.scss';

export interface FeedDetailOverlayProps extends Omit<FeedCardProps, 'height' | 'size' | 'children'> {
  /** 是否開啟 overlay */
  open?: boolean;
  /** 關閉事件（按下關閉按鈕或背景時觸發） */
  onClose?: () => void;
  /** hero 區高度（vh），預設 75 */
  heroHeightVH?: number;
  /** 關閉/初始狀態時 FeedCard/FeedCardInfo 使用的尺寸（hero/med/sm/xs），開啟時將統一使用 hero */
  sizeWhenClosed?: FeedCardSize;
  /** FeedCardInfo 資料，用於顯示 hero 與關閉狀態的資訊區 */
  infoData?: FeedCardInfoData;
  /** 主色（傳遞至 FeedCardInfo 的文字與標籤背景） */
  primaryColor?: string;
  /** 自訂文章內容；若未提供則使用預設內容 */
  content?: React.ReactNode;
  /** 文章區塊（未來可由 Strapi JSON 映射） */
  contentBlocks?: FeedContentBlock[];
  /** 額外類名（套用在根節點） */
  className?: string;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const FeedDetailOverlay = forwardRef<HTMLDivElement, FeedDetailOverlayProps>(({
  open = false,
  onClose,
  heroHeightVH = 75,
  content,
  contentBlocks,
  className = '',
  // FeedCard props passthrough
  src,
  sizeWhenClosed = 'hero',
  padding = 40,
  backgroundProps,
  secondaryColor,
  infoMaxWidth,
  style,
  enableHoverSound,
  soundVolume,
  infoData,
  primaryColor,
}, ref) => {
  // 將 vh 轉換為 px，以便傳給 FeedCard.height（該 prop 僅支援 number px）
  const [heroHeightPx, setHeroHeightPx] = useState<number>(() => {
    if (typeof window !== 'undefined') return Math.round(window.innerHeight * clamp(heroHeightVH, 10, 100) / 100);
    return 0;
  });

  const computeHeroHeight = useCallback(() => {
    const vh = clamp(heroHeightVH, 10, 100);
    setHeroHeightPx(Math.round(window.innerHeight * vh / 100));
  }, [heroHeightVH]);

  useEffect(() => {
    if (!open) return;
    computeHeroHeight();
    const onResize = () => computeHeroHeight();
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [open, computeHeroHeight]);

  // 開啟時鎖住 body 捲動
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const renderBlocks = (blocks: FeedContentBlock[]) => {
    return (
      <article className="fdo-article">
        {blocks.map((b, i) => {
          if (b.type === 'heading') {
            const level = b.level ?? 2;
            if (level === 1) return <h1 key={i}>{b.content}</h1>;
            if (level === 3) return <h3 key={i}>{b.content}</h3>;
            return <h2 key={i}>{b.content}</h2>;
          }
          if (b.type === 'paragraph') return <p key={i}>{b.content}</p>;
          if (b.type === 'image') return <img key={i} src={b.src} alt={b.alt || `image-${i + 1}`} />;
          if (b.type === 'list') return (
            <ul key={i}>
              {b.items.map((t, idx) => <li key={idx}>{t}</li>)}
            </ul>
          );
          return null;
        })}
      </article>
    );
  };

  const defaultContent = useMemo(() => {
    const images = Array.from({ length: 3 }).map((_, i) => (
      <img key={i} src={src} alt={`article-${i + 1}`} />
    ));
    return (
      <article className="fdo-article">
        <h1>UNTITLED PROJECT</h1>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vitae arcu ac neque commodo
          aliquet. Integer sodales, magna sit amet interdum luctus, massa risus egestas odio, a
          aliquet sem nisl id mauris.
        </p>
        {images[0]}
        <h2>Design Goals</h2>
        <p>
          Cras non nisl id nibh sollicitudin bibendum. Vestibulum ante ipsum primis in faucibus orci
          luctus et ultrices posuere cubilia curae; Nullam ultrices, ipsum quis pulvinar dignissim,
          neque tellus eleifend libero, in aliquam elit felis non magna.
        </p>
        <ul>
          <li>Responsive pixel aesthetics</li>
          <li>Playful motion with reduced-cost rendering</li>
          <li>Readable editorial layout</li>
        </ul>
        {images[1]}
        <h2>Process</h2>
        <p>
          Aenean imperdiet nunc non tempor laoreet. In et sem id neque volutpat fermentum sit amet
          id lectus. Integer placerat lectus vel lectus pharetra, non posuere sem convallis.
        </p>
        {images[2]}
        <p>
          Curabitur fringilla, augue ut suscipit pulvinar, erat lacus posuere turpis, id suscipit
          velit leo vel purus. Donec sit amet ligula quis ipsum convallis interdum.
        </p>
      </article>
    );
  }, [src]);

  // 關閉或初始狀態：外觀與 FeedCard 相同
  if (!open) {
    return (
      <div ref={ref} className={`feed-detail-overlay feed-detail-overlay--closed ${className}`.trim()} style={style}>
        <FeedCard
          src={src}
          size={sizeWhenClosed}
          padding={padding}
          backgroundProps={backgroundProps}
          secondaryColor={secondaryColor}
          infoMaxWidth={infoMaxWidth}
          className="feed-detail-overlay__card"
          enableHoverSound={enableHoverSound}
          soundVolume={soundVolume}
        >
          {infoData && (
            <FeedCardInfo
              data={infoData}
              size={sizeWhenClosed}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
          )}
        </FeedCard>
      </div>
    );
  }

  // 開啟狀態：固定 overlay + hero（FeedCard）+ 內容
  const openStyle = {
    '--feed-detail-primary-color': primaryColor,
    '--feed-detail-secondary-color': secondaryColor,
    ...style,
  } as React.CSSProperties;

  return (
    <div ref={ref} className={`feed-detail-overlay feed-detail-overlay--open ${className}`.trim()} role="dialog" aria-modal="true" style={openStyle}>
      <div className="feed-detail-overlay__backdrop" onClick={onClose} />
      <div className="feed-detail-overlay__content" aria-label="Feed detail overlay">
        <button className="feed-detail-overlay__close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
        <div className="feed-detail-overlay__hero" style={{ height: `${heroHeightPx}px` }}>
          <FeedCard
            src={src}
            size="hero"
            height={heroHeightPx}
            padding={padding}
            backgroundProps={backgroundProps}
            secondaryColor={secondaryColor}
            infoMaxWidth={infoMaxWidth}
            className="feed-detail-overlay__card"
            enableHoverSound={enableHoverSound}
            soundVolume={soundVolume}
            forceHovered={true}
            disableHover={true}
          >
            {infoData && (
              <FeedCardInfo
                data={infoData}
                size="hero"
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
              />
            )}
          </FeedCard>
        </div>
        <div className="feed-detail-overlay__body">
          {content ?? (contentBlocks ? renderBlocks(contentBlocks) : defaultContent)}
        </div>
      </div>
    </div>
  );
});

FeedDetailOverlay.displayName = 'FeedDetailOverlay';

export default FeedDetailOverlay;


