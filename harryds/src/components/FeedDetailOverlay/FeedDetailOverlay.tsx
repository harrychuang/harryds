// =============================================================================
// FEED DETAIL OVERLAY 元件
// - 關閉/初始狀態：外觀與 FeedCard 相同（包覆並自動 fit）
// - 開啟後：固定於視窗（fixed, top:0, left:0），內含 FeedCard 作為 hero（高度 75vh）
// - hero 下方顯示文章內容（文字 + 圖片，預設內容或結構化 blocks）
// =============================================================================

import React, { forwardRef, useCallback, useEffect, useMemo, useState, useRef, memo } from 'react';
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

// 記憶化的 Loading 組件以減少重渲染
const LoadingDisplay = memo<{
  progress: number;
  primaryColor?: string;
  secondaryColor?: string;
}>(({ progress, primaryColor, secondaryColor }) => (
  <div className="feed-detail-overlay__loading">
    <PixelText
      text="LOADING"
      textBoxEnabled={true}
      textBox={`${progress}%`}
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
));
LoadingDisplay.displayName = 'LoadingDisplay';

// 記憶化的圖片組件
const OptimizedDistortedPixels = memo<{
  src: string;
  scrollContainer: React.RefObject<HTMLDivElement>;
}>(({ src, scrollContainer }) => (
  <div className="fdo-image-container">
    <DistortedPixels 
      src={src} 
      objectFit="responsive"
      direction="x"
      maxPixelation={60}
      maxDistortion={0.8}
      scrollSensitivity={0.2}
      decaySpeed={0.96}
      scrollContainer={scrollContainer}
    />
  </div>
));
OptimizedDistortedPixels.displayName = 'OptimizedDistortedPixels';

const FeedDetailOverlayComponent = forwardRef<HTMLDivElement, FeedDetailOverlayProps>(({
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
  
  // 分階段動畫狀態管理
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [animationPhase, setAnimationPhase] = useState<'closed' | 'loading' | 'positioning' | 'expanding' | 'ready'>('closed');
  const loadingAnimationRef = useRef<number | null>(null);
  const loadingStartTimeRef = useRef<number>(0);
  
  // 位置追蹤相關
  const [originalPosition, setOriginalPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  // 將 vh 轉換為 px，以便傳給 FeedCard.height（該 prop 僅支援 number px）
  const [heroHeightPx, setHeroHeightPx] = useState<number>(() => {
    if (typeof window !== 'undefined') return Math.round(window.innerHeight * clamp(heroHeightVH, 10, 100) / 100);
    return 0;
  });

  const computeHeroHeight = useCallback(() => {
    const vh = clamp(heroHeightVH, 10, 100);
    setHeroHeightPx(Math.round(window.innerHeight * vh / 100));
  }, [heroHeightVH]);

  // 記錄原始位置的函數
  const captureOriginalPosition = useCallback(() => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    setOriginalPosition({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    });
  }, []);

  // 所有 useMemo hooks 必須在 early return 之前調用
  // 記憶化的樣式計算以減少重渲染
  const openStyle = useMemo(() => {
    const baseStyle = {
      '--feed-detail-primary-color': primaryColor,
      '--feed-detail-secondary-color': secondaryColor,
      ...style,
    } as React.CSSProperties;

    // 根據動畫階段添加不同的樣式
    if (animationPhase === 'positioning' && originalPosition) {
      // 位置動畫階段：從原始位置移動到 fixed position
      return {
        ...baseStyle,
        '--original-x': `${originalPosition.x}px`,
        '--original-y': `${originalPosition.y}px`,
        '--original-width': `${originalPosition.width}px`,
        '--original-height': `${originalPosition.height}px`,
      };
    }

    return baseStyle;
  }, [primaryColor, secondaryColor, style, animationPhase, originalPosition]);

  // 記憶化的 CSS 類名計算
  const overlayClassName = useMemo(() => {
    const classes = ['feed-detail-overlay'];
    
    if (!open) {
      classes.push('feed-detail-overlay--closed');
    } else {
      classes.push('feed-detail-overlay--open');
      classes.push(`feed-detail-overlay--${animationPhase}`);
    }
    
    if (className) classes.push(className);
    return classes.join(' ').trim();
  }, [open, animationPhase, className]);

  // 記憶化的 hero 樣式計算
  const heroStyle = useMemo(() => ({
    height: animationPhase === 'expanding' || animationPhase === 'ready' ? `${heroHeightPx}px` : 'auto'
  }), [animationPhase, heroHeightPx]);

  // 記憶化的 FeedCard 屬性以減少重渲染
  const feedCardProps = useMemo(() => ({
    src,
    size: (animationPhase === 'expanding' || animationPhase === 'ready' ? "hero" : sizeWhenClosed) as FeedCardSize,
    height: animationPhase === 'expanding' || animationPhase === 'ready' ? heroHeightPx : undefined,
    padding,
    backgroundProps,
    secondaryColor,
    infoMaxWidth,
    className: "feed-detail-overlay__card",
    enableHoverSound,
    soundVolume,
    forceHovered: true,
    disableHover: true,
  }), [
    src, 
    animationPhase, 
    sizeWhenClosed, 
    heroHeightPx, 
    padding, 
    backgroundProps, 
    secondaryColor, 
    infoMaxWidth, 
    enableHoverSound, 
    soundVolume
  ]);

  // 記憶化的 FeedCardInfo 屬性
  const feedCardInfoProps = useMemo(() => ({
    data: infoData!,
    size: (animationPhase === 'expanding' || animationPhase === 'ready' ? "hero" : sizeWhenClosed) as FeedCardSize,
    primaryColor,
    secondaryColor,
  }), [infoData, animationPhase, sizeWhenClosed, primaryColor, secondaryColor]);

  // 合併 ref 處理
  const combinedRef = useCallback((node: HTMLDivElement | null) => {
    overlayRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);

  useEffect(() => {
    if (!open) return;
    computeHeroHeight();
    const onResize = () => computeHeroHeight();
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [open, computeHeroHeight]);

  // 開啟時鎖住 body 捲動（優化版本）
  useEffect(() => {
    if (!open) return;
    
    // 使用 requestAnimationFrame 確保在瀏覽器重繪前應用樣式
    let rafId: number;
    const prev = document.body.style.overflow;
    
    rafId = requestAnimationFrame(() => {
      document.body.style.overflow = 'hidden';
    });
    
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.body.style.overflow = prev;
    };
  }, [open]);

  // 分階段動畫邏輯：loading → positioning → expanding → ready
  useEffect(() => {
    if (!open) {
      // 關閉時重置所有狀態
      setIsLoading(false);
      setLoadingProgress(0);
      setAnimationPhase('closed');
      setOriginalPosition(null);
      if (loadingAnimationRef.current) {
        cancelAnimationFrame(loadingAnimationRef.current);
        loadingAnimationRef.current = null;
      }
      return;
    }

    // 開啟時：先記錄原始位置，然後開始 loading
    captureOriginalPosition();
    setAnimationPhase('loading');
    setIsLoading(true);
    setLoadingProgress(0);

    // 使用 requestAnimationFrame 優化動畫性能
    const totalDuration = 2500; // 總時長 2.5 秒
    loadingStartTimeRef.current = performance.now();

    const updateProgress = (currentTime: number) => {
      const elapsed = currentTime - loadingStartTimeRef.current;
      const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      
      if (progress < 100) {
        setLoadingProgress(progress);
        loadingAnimationRef.current = requestAnimationFrame(updateProgress);
      } else {
        // Loading 完成，開始分階段動畫
        setLoadingProgress(100);
        setIsLoading(false);
        
        // 階段 1: 位置動畫 (600ms)
        requestAnimationFrame(() => {
          setAnimationPhase('positioning');
          
          // 階段 2: FeedCard 擴展 (600ms, 延遲 200ms)  
          setTimeout(() => {
            setAnimationPhase('expanding');
            
            // 階段 3: Content 展開 (500ms, 延遲 400ms)
            setTimeout(() => {
              setAnimationPhase('ready');
            }, 700); // 600ms expanding + 100ms buffer
          }, 800); // 600ms positioning + 200ms buffer
        });
      }
    };

    // 初始延遲後開始動畫
    const startDelay = 200;
    setTimeout(() => {
      loadingStartTimeRef.current = performance.now();
      loadingAnimationRef.current = requestAnimationFrame(updateProgress);
    }, startDelay);

    return () => {
      if (loadingAnimationRef.current) {
        cancelAnimationFrame(loadingAnimationRef.current);
        loadingAnimationRef.current = null;
      }
    };
  }, [open, captureOriginalPosition]);

  // 記憶化的 renderBlocks 函數以減少重渲染
  const renderBlocks = useCallback((blocks: FeedContentBlock[]) => {
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
            <OptimizedDistortedPixels 
              key={i}
              src={b.src} 
              scrollContainer={scrollContentRef}
            />
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
  }, []);

  // 記憶化的默認內容以提升性能
  const defaultContent = useMemo(() => {
    if (!src) return null;
    
    return (
      <article className="fdo-article">
        <h1>UNTITLED PROJECT</h1>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vitae arcu ac neque commodo
          aliquet. Integer sodales, magna sit amet interdum luctus, massa risus egestas odio, a
          aliquet sem nisl id mauris.
        </p>
        <OptimizedDistortedPixels src={src} scrollContainer={scrollContentRef} />
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
        <OptimizedDistortedPixels src={src} scrollContainer={scrollContentRef} />
        <h2>Process</h2>
        <p>
          Aenean imperdiet nunc non tempor laoreet. In et sem id neque volutpat fermentum sit amet
          id lectus. Integer placerat lectus vel lectus pharetra, non posuere sem convallis.
        </p>
        <OptimizedDistortedPixels src={src} scrollContainer={scrollContentRef} />
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
      <div ref={combinedRef} className={overlayClassName} style={style}>
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

  return (
    <div ref={combinedRef} className={overlayClassName} role="dialog" aria-modal="true" style={openStyle}>
      {/* Backdrop 只在最終階段顯示 */}
      {animationPhase === 'ready' && <div className="feed-detail-overlay__backdrop" onClick={onClose} />}
      
      <div ref={scrollContentRef} className="feed-detail-overlay__content" aria-label="Feed detail overlay">
        {/* Loading 狀態（固定在視窗右上角） */}
        {isLoading && (
          <LoadingDisplay 
            progress={loadingProgress}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        )}
        
        {/* Hero 區域 - 分階段動畫 */}
        <div 
          className="feed-detail-overlay__hero" 
          style={heroStyle}
        >
          <FeedCard {...feedCardProps}>
            {infoData && <FeedCardInfo {...feedCardInfoProps} />}
          </FeedCard>
        </div>
        
        {/* Body 內容 - 只在 ready 階段顯示 */}
        {animationPhase === 'ready' && (
          <div className="feed-detail-overlay__body">
            {content ?? (contentBlocks ? renderBlocks(contentBlocks) : defaultContent)}
          </div>
        )}
      </div>
    </div>
  );
});

FeedDetailOverlayComponent.displayName = 'FeedDetailOverlay';

// 使用 memo 來防止不必要的重渲染，對比 props 是否有實質性變化
export const FeedDetailOverlay = memo(FeedDetailOverlayComponent, (prevProps, nextProps) => {
  // 自定義比較函數，只有在關鍵 props 變化時才重渲染
  const keyProps = [
    'open', 'heroHeightVH', 'sizeWhenClosed', 'src', 'padding', 
    'primaryColor', 'secondaryColor', 'infoMaxWidth', 'className'
  ] as const;
  
  for (const prop of keyProps) {
    if (prevProps[prop] !== nextProps[prop]) {
      return false; // props 有變化，需要重渲染
    }
  }
  
  // 深度比較 infoData
  if (JSON.stringify(prevProps.infoData) !== JSON.stringify(nextProps.infoData)) {
    return false;
  }
  
  // 深度比較 contentBlocks
  if (JSON.stringify(prevProps.contentBlocks) !== JSON.stringify(nextProps.contentBlocks)) {
    return false;
  }
  
  return true; // props 沒有變化，可以跳過重渲染
});

export default FeedDetailOverlay;


