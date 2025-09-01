// =============================================================================
// FEED DETAIL OVERLAY 元件
// - 關閉/初始狀態：外觀與 FeedCard 相同（包覆並自動 fit）
// - 開啟後：固定於視窗（fixed, top:0, left:0），內含 FeedCard 作為 hero（高度 75vh）
// - hero 下方顯示文章內容（文字 + 圖片，預設內容或結構化 blocks）
// =============================================================================

import React, { forwardRef, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { FeedCard } from '../FeedCard';
import type { FeedCardProps } from '../FeedCard';
import type { FeedCardSize } from '../FeedCard/FeedCard';
import { FeedCardInfo } from '../FeedCard';
import type { FeedCardInfoData } from '../FeedCard';
import type { FeedContentBlock } from '../../types/feed';
import { DistortedPixels } from '../DistortedPixels';
import { PixelText } from '../PixelText';
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
  // 滾動容器引用
  const scrollContentRef = useRef<HTMLDivElement | null>(null);
  
  // Loading 狀態管理
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [contentReady, setContentReady] = useState(false);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
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

  // Loading 邏輯：當 open 為 true 時開始 loading，完成後才真正開啟內容
  useEffect(() => {
    if (!open) {
      // 關閉時重置所有狀態
      setIsLoading(false);
      setLoadingProgress(0);
      setContentReady(false);
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      return;
    }

    // 開啟時先重置狀態，然後開始 loading
    setContentReady(false);
    setIsLoading(true);
    setLoadingProgress(0);

    // 模擬 loading 進度（2-3 秒完成）
    const totalDuration = 2500; // 總時長 2.5 秒
    const updateInterval = 50; // 每 50ms 更新一次
    const totalSteps = totalDuration / updateInterval;
    let currentStep = 0;

    const updateProgress = () => {
      currentStep++;
      const progress = Math.min(100, Math.round((currentStep / totalSteps) * 100));
      setLoadingProgress(progress);

      if (progress < 100) {
        loadingTimerRef.current = setTimeout(updateProgress, updateInterval);
      } else {
        // Loading 完成，隱藏 loading 並顯示內容
        loadingTimerRef.current = setTimeout(() => {
          setIsLoading(false);
          setContentReady(true); // 這時候才真正開啟內容
        }, 300);
      }
    };

    // 開始更新進度
    loadingTimerRef.current = setTimeout(updateProgress, 200); // 初始延遲 200ms

    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
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
          if (b.type === 'image') return (
            <div key={i} className="fdo-image-container">
              <DistortedPixels 
                src={b.src} 
                objectFit="responsive"
                direction="x"
                maxPixelation={60}
                maxDistortion={0.8}
                scrollSensitivity={0.2}
                decaySpeed={0.96}
                scrollContainer={scrollContentRef}
              />
            </div>
          );
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
      <div key={i} className="fdo-image-container">
        <DistortedPixels 
          src={src!} 
          objectFit="responsive"
          direction="x"
          maxPixelation={60}
          maxDistortion={0.8}
          scrollSensitivity={0.2}
          decaySpeed={0.96}
          scrollContainer={scrollContentRef}
        />
      </div>
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
    <div ref={ref} className={`feed-detail-overlay feed-detail-overlay--open ${isLoading ? 'feed-detail-overlay--loading' : ''} ${contentReady ? 'feed-detail-overlay--content-ready' : ''} ${className}`.trim()} role="dialog" aria-modal="true" style={openStyle}>
      {/* Backdrop 只在內容準備好後顯示（fixed 模式） */}
      {contentReady && <div className="feed-detail-overlay__backdrop" onClick={onClose} />}
      <div ref={scrollContentRef} className="feed-detail-overlay__content" aria-label="Feed detail overlay">
        
        {/* Loading 狀態（固定在視窗右上角，參考原 close 按鈕位置） */}
        {isLoading && (
          <div className="feed-detail-overlay__loading">
            <PixelText
              text="LOADING"
              textBoxEnabled={true}
              textBox={`${loadingProgress}%`}
              textBoxWidth={5}
              textBoxPadding={2}
              animated={false}
              durationTime={400}
              animationDelay={100}
              easeGlitch={false}
              primaryColor={primaryColor}
              onPrimaryColor={secondaryColor}
              pixelSize={2}
              letterSpacing={1}
              width={250}
              height={50}
            />
          </div>
        )}
        
        {/* Hero 區域（loading 期間保持原尺寸，完成後變為 hero 高度） */}
        <div 
          className="feed-detail-overlay__hero" 
          style={contentReady ? { height: `${heroHeightPx}px` } : { height: 'auto' }}
        >
          <FeedCard
            src={src}
            size={contentReady ? "hero" : sizeWhenClosed}
            height={contentReady ? heroHeightPx : undefined}
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
                size={contentReady ? "hero" : sizeWhenClosed}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
              />
            )}
          </FeedCard>
        </div>
        
        {/* Body 內容（只有當 loading 完成且內容準備好時才顯示） */}
        {contentReady && (
          <div className="feed-detail-overlay__body">
            {content ?? (contentBlocks ? renderBlocks(contentBlocks) : defaultContent)}
          </div>
        )}
      </div>
    </div>
  );
});

FeedDetailOverlay.displayName = 'FeedDetailOverlay';

export default FeedDetailOverlay;


