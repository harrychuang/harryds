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
import type { FeedContentBlock, ProjectInfo } from '../../types/feed';
import './FeedDetailOverlay.scss';
import startSoundUrl from '../../../assets/sound/8-Bit Retro Sound Effect-level-up.mp3';
import { audioManager, type PlaybackHandle } from '../../utils/audioManager';
import iconLinkUrl from '../../../assets/imgs/icon/icon-link.svg';

export interface FeedDetailOverlayProps extends Omit<FeedCardProps, 'height' | 'size' | 'children'> {
  /** 是否開啟 overlay */
  open?: boolean;
  /** 關閉事件（按下關閉按鈕或背景時觸發） */
  onClose?: () => void;
  /** 動畫階段變化回調 */
  onAnimationPhaseChange?: (phase: 'closed' | 'expanding' | 'ready') => void;
  /** hero 區高度（vh），預設 75 */
  heroHeightVH?: number;
  /** 關閉/初始狀態時 FeedCard/FeedCardInfo 使用的尺寸（hero/med/sm/xs），開啟時將統一使用 hero */
  sizeWhenClosed?: FeedCardSize;
  /** FeedCardInfo 資料，用於顯示 hero 與關閉狀態的資訊區 */
  infoData?: FeedCardInfoData;
  /** 主色（傳遞至 FeedCardInfo 的文字與標籤背景） */
  primaryColor?: string;
  /** 額外類名（套用在根節點） */
  className?: string;
  /** 文章內容區塊（段落、標題、圖片、影片、列表等） */
  contentBlocks?: FeedContentBlock[];
  /** 專案資訊（客戶、角色、描述） */
  projectInfo?: ProjectInfo;
}

// hero 高度現在由 CSS 直接設定為 75vh

const FeedDetailOverlayComponent = forwardRef<HTMLDivElement, FeedDetailOverlayProps>(({
  open = false,
  onClose,
  onAnimationPhaseChange,
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
  contentBlocks,
  projectInfo,
}, ref) => {
  // 滾動容器引用
  const scrollContentRef = useRef<HTMLDivElement | null>(null);
  
  // 分階段動畫狀態管理
  const [animationPhase, setAnimationPhase] = useState<'closed' | 'expanding' | 'ready'>('closed');
  const startHandleRef = useRef<PlaybackHandle | null>(null);
  const hasPlayedStartSoundRef = useRef<boolean>(false);
  // 滾動交互動態控制 PixelImage 背景（pixelSize 與 maskOpacity）
  const [scrollPixelSize, setScrollPixelSize] = useState<number>(1);
  const [scrollMaskOpacity, setScrollMaskOpacity] = useState<number>(0.8);
  const scrollRafRef = useRef<number | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  
  const overlayRef = useRef<HTMLDivElement | null>(null);
  // 注意：hero 高度現在由 CSS 直接設定為 75vh，不再需要 JavaScript 計算

  // 動畫階段變化通知
  useEffect(() => {
    onAnimationPhaseChange?.(animationPhase);
  }, [animationPhase, onAnimationPhaseChange]);

  // 渲染內容區塊的函數
  const renderContentBlock = useCallback((block: FeedContentBlock, index: number) => {
    switch (block.type) {
      case 'heading':
        const HeadingTag = `h${block.level || 2}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag key={index} className="feed-detail-overlay__heading">
            {block.content}
          </HeadingTag>
        );
      case 'paragraph':
        return (
          <p key={index} className="feed-detail-overlay__paragraph">
            {block.content}
          </p>
        );
      case 'image':
        return (
          <figure key={index} className="feed-detail-overlay__image-wrapper">
            <img 
              src={block.src} 
              alt={block.alt || ''} 
              className="feed-detail-overlay__image"
            />
          </figure>
        );
      case 'video':
        return (
          <figure key={index} className="feed-detail-overlay__video-wrapper">
            <video 
              src={block.src}
              poster={block.poster}
              autoPlay={block.autoplay}
              loop={block.loop}
              muted={block.muted}
              controls={block.controls}
              className="feed-detail-overlay__video"
            >
              Your browser does not support the video tag.
            </video>
          </figure>
        );
      case 'list':
        return (
          <ul key={index} className="feed-detail-overlay__list">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="feed-detail-overlay__list-item">
                {item}
              </li>
            ))}
          </ul>
        );
      default:
        return null;
    }
  }, []);

  // 所有 useMemo hooks 必須在 early return 之前調用
  // 記憶化的樣式計算以減少重渲染
  const openStyle = useMemo(() => {
    return {
      '--feed-detail-primary-color': primaryColor,
      '--feed-detail-secondary-color': secondaryColor,
      ...style,
    } as React.CSSProperties;
  }, [primaryColor, secondaryColor, style]);

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
    if (hasPlayedStartSoundRef.current) return;
    try {
      startHandleRef.current?.stop();
      startHandleRef.current = await audioManager.play(startSoundUrl, { volume: Math.max(0, Math.min(1, soundVolume ?? 0.2)) });
      hasPlayedStartSoundRef.current = true;
    } catch (err) {
      console.warn('Overlay start sound play failed:', err);
    }
  }, [soundVolume]);

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
    '--feed-card-info-max-width': `${Math.max(1, infoMaxWidth || 1400)}px`,
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

  // 預載開場音效（Web Audio）
  useEffect(() => {
    audioManager.preload(startSoundUrl).catch(() => {});
  }, [soundVolume]);

  // 分階段動畫邏輯：expanding → ready
  useEffect(() => {
    if (!open) {
      // 關閉時重置所有狀態
      setAnimationPhase('closed');
      setScrollPixelSize(1);
      setScrollMaskOpacity(0.8);
      hasPlayedStartSoundRef.current = false;
      // 停止播放中的音效
      startHandleRef.current?.stop();
      return;
    }

    // 開啟時：直接進入 expanding 階段
    requestAnimationFrame(() => {
      playStartSound();
      setAnimationPhase('expanding');
      
      // 擴展完成後顯示內容
      setTimeout(() => {
        setAnimationPhase('ready');
      }, 900); // 800ms expanding + 100ms buffer
    });
  }, [open, playStartSound]);

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
        {/* Hero 區域 - 分階段動畫 */}
        <div 
          className="feed-detail-overlay__hero" 
          style={heroStyle}
        >
          {/* Expanding/Ready 階段：FeedCardInfo 獨立顯示在 hero 底部，背景改由 fixed 層處理 */}
          {(animationPhase === 'expanding' || animationPhase === 'ready') && infoData && (
            <div className="feed-detail-overlay__hero-content" style={heroContentStyle}>
              <FeedCardInfo {...feedCardInfoProps} hovered={true} />
            </div>
          )}
        </div>

        {/* 專案資訊區域 - 只在 ready 階段顯示 */}
        {animationPhase === 'ready' && projectInfo && (
          <section className="feed-detail-overlay__project-main">
            <div className="feed-detail-overlay__project-container">
              <aside className="feed-detail-overlay__project-meta">
                <div className="feed-detail-overlay__meta-content">
                  {projectInfo.client && (
                    <div className="feed-detail-overlay__meta-item">
                      <h3 className="feed-detail-overlay__meta-label">Client</h3>
                      <p className="feed-detail-overlay__meta-value">{projectInfo.client}</p>
                    </div>
                  )}
                  {projectInfo.roles && projectInfo.roles.length > 0 && (
                    <div className="feed-detail-overlay__meta-item">
                      <h3 className="feed-detail-overlay__meta-label">Role</h3>
                      <div className="feed-detail-overlay__meta-value">
                        {projectInfo.roles.map((role, idx) => (
                          <p key={idx}>{role}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {projectInfo.websiteUrl && (
                  <a 
                    href={projectInfo.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="feed-detail-overlay__cta-button"
                  >
                    <div 
                      className="feed-detail-overlay__cta-background"
                      style={{
                        '--cta-primary': primaryColor,
                        '--cta-secondary': secondaryColor,
                      } as React.CSSProperties}
                    >
                      {/* 12個方塊背景 - 顏色會循環移動 */}
                      <div className="feed-detail-overlay__cta-stripe" data-stripe="1" />
                      <div className="feed-detail-overlay__cta-stripe" data-stripe="2" />
                      <div className="feed-detail-overlay__cta-stripe" data-stripe="3" />
                      <div className="feed-detail-overlay__cta-stripe" data-stripe="4" />
                      <div className="feed-detail-overlay__cta-stripe" data-stripe="5" />
                      <div className="feed-detail-overlay__cta-stripe" data-stripe="6" />
                      <div className="feed-detail-overlay__cta-stripe" data-stripe="7" />
                      <div className="feed-detail-overlay__cta-stripe" data-stripe="8" />
                      <div className="feed-detail-overlay__cta-stripe" data-stripe="9" />
                      <div className="feed-detail-overlay__cta-stripe" data-stripe="10" />
                      <div className="feed-detail-overlay__cta-stripe" data-stripe="11" />
                      <div className="feed-detail-overlay__cta-stripe" data-stripe="12" />
                    </div>
                    <span className="feed-detail-overlay__cta-content">
                      <img 
                        src={iconLinkUrl} 
                        alt="" 
                        className="feed-detail-overlay__cta-icon"
                      />
                      <span className="feed-detail-overlay__cta-text">
                        {projectInfo.websiteLabel || 'VISIT WEBSITE'}
                      </span>
                    </span>
                  </a>
                )}
              </aside>
              
              <div className="feed-detail-overlay__project-content">
                {projectInfo.description && (
                  <p className="feed-detail-overlay__project-description">
                    {projectInfo.description}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 文章內容區域 - 只在 ready 階段顯示 */}
        {animationPhase === 'ready' && contentBlocks && contentBlocks.length > 0 && (
          <article className="feed-detail-overlay__article">
            {contentBlocks.map((block, index) => renderContentBlock(block, index))}
          </article>
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
  
  // 深度比較 projectInfo
  if (JSON.stringify(prevProps.projectInfo) !== JSON.stringify(nextProps.projectInfo)) {
    return false;
  }
  
  return true; // props 沒有變化，可以跳過重渲染
});

export default FeedDetailOverlay;


