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
// import startSoundUrl from '../../../assets/sound/8-Bit Sound Effect.mp3';
import startSoundUrl from '../../../assets/sound/8-Bit Retro Sound Effect-level-up.mp3';
import loadingSoundUrl from '../../../assets/sound/8-Bit Game Start Sound.mp3';

export interface FeedDetailOverlayProps extends Omit<FeedCardProps, 'height' | 'size' | 'children'> {
  /** 是否開啟 overlay */
  open?: boolean;
  /** 關閉事件（按下關閉按鈕或背景時觸發） */
  onClose?: () => void;
  /** 動畫階段變化回調 */
  onAnimationPhaseChange?: (phase: 'closed' | 'loading' | 'positioning' | 'expanding' | 'ready') => void;
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

// hero 高度現在由 CSS 直接設定為 75vh

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

// 記憶化的圖片組件（等圖片載入後才觸發揭露動畫）
const OptimizedDistortedPixels = memo<{
  src: string;
  scrollContainer: React.RefObject<HTMLDivElement>;
}>(({ src, scrollContainer }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  return (
    <div className={`fdo-image-container ${isLoaded ? 'is-loaded' : 'is-loading'}`.trim()}>
      <DistortedPixels 
        src={src} 
        objectFit="responsive"
        direction="x"
        maxPixelation={60}
        maxDistortion={0.8}
        scrollSensitivity={0.2}
        decaySpeed={0.96}
        scrollContainer={scrollContainer}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
});
OptimizedDistortedPixels.displayName = 'OptimizedDistortedPixels';

const FeedDetailOverlayComponent = forwardRef<HTMLDivElement, FeedDetailOverlayProps>(({
  open = false,
  onClose,
  onAnimationPhaseChange,
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
  use2D,
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
  const startSoundRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedStartSoundRef = useRef<boolean>(false);
  const loadingSoundRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedLoadingSoundRef = useRef<boolean>(false);
  // 滾動交互動態控制 PixelImage 背景（pixelSize 與 maskOpacity）
  const [scrollPixelSize, setScrollPixelSize] = useState<number>(1);
  const [scrollMaskOpacity, setScrollMaskOpacity] = useState<number>(0.8);
  const scrollRafRef = useRef<number | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  
  // 位置追蹤相關
  const [originalPosition, setOriginalPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  // 注意：hero 高度現在由 CSS 直接設定為 75vh，不再需要 JavaScript 計算

  // 動畫階段變化通知
  useEffect(() => {
    onAnimationPhaseChange?.(animationPhase);
  }, [animationPhase, onAnimationPhaseChange]);

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

  // 記憶化的 hero 樣式計算（高度現在由 CSS 控制）
  const heroStyle = useMemo(() => ({
    // 高度由 CSS 中的 .feed-detail-overlay--expanding/ready 控制為 75vh
  }), []);

  const playStartSound = useCallback(async () => {
    if (!startSoundRef.current || hasPlayedStartSoundRef.current) return;
    try {
      startSoundRef.current.currentTime = 0;
      await startSoundRef.current.play();
      hasPlayedStartSoundRef.current = true;
    } catch (err) {
      console.warn('Overlay start sound play failed:', err);
    }
  }, []);

  const playLoadingSound = useCallback(async () => {
    if (!loadingSoundRef.current || hasPlayedLoadingSoundRef.current) return;
    try {
      loadingSoundRef.current.currentTime = 0;
      await loadingSoundRef.current.play();
      hasPlayedLoadingSoundRef.current = true;
    } catch (err) {
      console.warn('Overlay loading sound play failed:', err);
    }
  }, []);

  // 記憶化的 FeedCard 屬性以減少重渲染（用於 loading/positioning 階段）
  const feedCardProps = useMemo(() => ({
    src,
    size: sizeWhenClosed as FeedCardSize,
    height: undefined, // loading/positioning 階段使用預設高度
    padding,
    backgroundProps: {
      ...backgroundProps,
      pixelSize: scrollPixelSize,
      maskOpacity: scrollMaskOpacity,
      hoverPixelToOne: false, // 關閉 hover 時像素補間至 1 的行為
      maskColor: secondaryColor, // 明確指定遮罩色為 secondaryColor
    },
    secondaryColor,
    infoMaxWidth,
    className: "feed-detail-overlay__card",
    enableHoverSound,
    soundVolume,
    forceHovered: false, // 不強制 hovered，避免觸發 hover 動畫
    disableHover: true,
    use2D,
  }), [
    src, 
    sizeWhenClosed, 
    padding, 
    backgroundProps, 
    secondaryColor, 
    infoMaxWidth, 
    enableHoverSound, 
    soundVolume,
    use2D
  ]);

  // 記憶化的 FeedCardInfo 屬性
  const feedCardInfoProps = useMemo(() => ({
    data: infoData!,
    size: (animationPhase === 'expanding' || animationPhase === 'ready' ? "hero" : sizeWhenClosed) as FeedCardSize,
    primaryColor,
    secondaryColor,
  }), [infoData, animationPhase, sizeWhenClosed, primaryColor, secondaryColor]);
  
  // hero 區域的 CSS 變數（用於 FeedCardInfo 容器的樣式）
  type HeroContentStyle = React.CSSProperties & { 
    ['--feed-card-padding']?: string;
    ['--feed-card-info-max-width']?: string;
  };
  
  const heroContentStyle = useMemo((): HeroContentStyle => ({
    '--feed-card-padding': `${Math.max(0, padding)}px`,
    '--feed-card-info-max-width': `${Math.max(1, infoMaxWidth || 1600)}px`,
  }), [padding, infoMaxWidth]);

  // 合併 ref 處理
  const combinedRef = useCallback((node: HTMLDivElement | null) => {
    overlayRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);

  // 高度計算已移除，由 CSS 75vh 直接處理

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

  // open 狀態下，根據內容區塊的 Y 捲動量在 0-400px 範圍內映射 pixelSize(1→80) 與 maskOpacity(0.8→0.9)
  useEffect(() => {
    if (!open || !scrollContentRef.current) return;
    const el = scrollContentRef.current;

    const updateByScrollTop = (scrollTop: number) => {
      const clamped = Math.max(0, Math.min(400, scrollTop)) / 400;
      const pixelSize = 1 + clamped * 79; // 1 → 80
      const maskOpacity = 0.85 + clamped * 0.1; // 0.8 → 0.95
      setScrollPixelSize(pixelSize);
      setScrollMaskOpacity(maskOpacity);
    };

    const onScroll = () => {
      lastScrollTopRef.current = el.scrollTop;
      if (scrollRafRef.current !== null) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        updateByScrollTop(lastScrollTopRef.current);
        scrollRafRef.current = null;
      });
    };

    // 初始化（進入 open 狀態時依目前 scrollTop 設定一次）
    updateByScrollTop(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      el.removeEventListener('scroll', onScroll);
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };
  }, [open]);

  // 初始化/更新開場音效
  useEffect(() => {
    startSoundRef.current = new Audio(startSoundUrl);
    startSoundRef.current.preload = 'auto';
    startSoundRef.current.volume = Math.max(0, Math.min(1, soundVolume ?? 0.3));

    const onCanPlay = () => {};
    const onError = (e: any) => {
      console.error('FeedDetailOverlay start sound load failed:', e);
    };

    startSoundRef.current.addEventListener('canplaythrough', onCanPlay);
    startSoundRef.current.addEventListener('error', onError);

    return () => {
      if (startSoundRef.current) {
        startSoundRef.current.removeEventListener('canplaythrough', onCanPlay);
        startSoundRef.current.removeEventListener('error', onError);
        startSoundRef.current = null;
      }
    };
  }, [soundVolume]);

  // 初始化/更新 loading 音效
  useEffect(() => {
    loadingSoundRef.current = new Audio(loadingSoundUrl);
    loadingSoundRef.current.preload = 'auto';
    loadingSoundRef.current.volume = Math.max(0, Math.min(1, soundVolume ?? 0.3));

    const onCanPlay = () => {};
    const onError = (e: any) => {
      console.error('FeedDetailOverlay loading sound load failed:', e);
    };

    loadingSoundRef.current.addEventListener('canplaythrough', onCanPlay);
    loadingSoundRef.current.addEventListener('error', onError);

    return () => {
      if (loadingSoundRef.current) {
        loadingSoundRef.current.removeEventListener('canplaythrough', onCanPlay);
        loadingSoundRef.current.removeEventListener('error', onError);
        loadingSoundRef.current = null;
      }
    };
  }, [soundVolume]);

  // 分階段動畫邏輯：loading → positioning → expanding → ready
  useEffect(() => {
    if (!open) {
      // 關閉時重置所有狀態
      setIsLoading(false);
      setLoadingProgress(0);
      setAnimationPhase('closed');
      setOriginalPosition(null);
      setScrollPixelSize(1);
      setScrollMaskOpacity(0.8);
      hasPlayedStartSoundRef.current = false;
      hasPlayedLoadingSoundRef.current = false;
      if (startSoundRef.current) {
        startSoundRef.current.pause();
        startSoundRef.current.currentTime = 0;
      }
      if (loadingSoundRef.current) {
        loadingSoundRef.current.pause();
        loadingSoundRef.current.currentTime = 0;
      }
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
    playLoadingSound();

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
        
        // 直接進入擴展階段，避免 hero 先在下方再上升
        requestAnimationFrame(() => {
          playStartSound();
          setAnimationPhase('expanding');
          
          // 擴展完成後顯示內容
          setTimeout(() => {
            setAnimationPhase('ready');
          }, 900); // 800ms expanding + 100ms buffer
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
  }, [open, captureOriginalPosition, playStartSound, playLoadingSound]);

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
          use2D={use2D}
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
      {/* 背景層：在 expanding 與 ready 階段均啟用 fixed 背景 */}
      {(animationPhase === 'expanding' || animationPhase === 'ready') && (
        <div className="feed-detail-overlay__fixed-background">
          <FeedCard
            src={src}
            size="hero"
            padding={0}
            backgroundProps={{
              ...backgroundProps,
              pixelSize: scrollPixelSize,
              maskOpacity: scrollMaskOpacity,
              hoverPixelToOne: false,
              maskColor: secondaryColor,
              hoverActive: true, // 強制 PixelImage 使用 hover 顏色（secondaryColor）
            }}
            secondaryColor={secondaryColor}
            className="feed-detail-overlay__background-card"
            enableHoverSound={false}
            forceHovered={false}
            disableHover={true}
          />
        </div>
      )}
      
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
          {/* Loading 階段：顯示完整的 FeedCard */}
          {animationPhase === 'loading' && (
            <FeedCard 
              {...feedCardProps}
              forceHovered={true}
              disableHover={true}
              backgroundProps={{
                ...backgroundProps,
                pixelSize: scrollPixelSize,
                maskOpacity: scrollMaskOpacity,
                hoverPixelToOne: false,
                maskColor: secondaryColor,
                hoverActive: true,
              }}
            >
              {infoData && <FeedCardInfo {...feedCardInfoProps} />}
            </FeedCard>
          )}
          
          {/* Expanding/Ready 階段：FeedCardInfo 獨立顯示在 hero 底部，背景改由 fixed 層處理 */}
          {(animationPhase === 'expanding' || animationPhase === 'ready') && infoData && (
            <div className="feed-detail-overlay__hero-content" style={heroContentStyle}>
              <FeedCardInfo {...feedCardInfoProps} hovered={true} />
            </div>
          )}
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
    'primaryColor', 'secondaryColor', 'infoMaxWidth', 'className', 'use2D'
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


