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
import type { FeedContentBlock, ProjectInfo, ProjectSectionContent } from '../../types/feed';
import './FeedDetailOverlay.scss';
import startSoundUrl from '../../../assets/sound/8-Bit Retro Sound Effect-level-up.mp3';
import { audioManager, type PlaybackHandle } from '../../utils/audioManager';
import { CTAButton } from '../CTAButton';
import { DistortedPixels2D } from '../DistortedPixels/DistortedPixels2D';

// 使用 Vite 的 glob import 來預載所有圖片（支援 harryds 和 portfolio）
const imageModules = import.meta.glob<{ default: string }>('../../../assets/imgs/**/*.{jpg,jpeg,png,gif,webp,svg}', { eager: true });

// 輔助函數：解析圖片路徑
const resolveImageSrc = (src: string): string => {
  // 如果已經是完整 URL（http/https/blob），直接返回
  if (/^(https?:|blob:)/.test(src)) {
    return src;
  }
  
  // 嘗試從 glob import 結果中查找
  // 方法 1: 直接查找完整路徑
  const fullPath = `../../../assets/imgs/${src}`;
  if (imageModules[fullPath]) {
    return imageModules[fullPath].default;
  }
  
  // 方法 2: 遍歷所有 keys 找到匹配的結尾
  for (const [key, module] of Object.entries(imageModules)) {
    if (key.endsWith(src) || key.endsWith(`/${src}`)) {
      console.log('[FeedDetailOverlay] 解析圖片 (結尾匹配):', src, 'key:', key);
      return module.default;
    }
  }
  
  // 如果找不到，回退到使用 new URL 方式
  try {
    return new URL(`../../../assets/imgs/${src}`, import.meta.url).href;
  } catch {
    console.warn('[FeedDetailOverlay] 無法解析圖片:', src);
    console.warn('[FeedDetailOverlay] 可用的圖片 keys:', Object.keys(imageModules).slice(0, 5));
    return src; // 最後回退到原始路徑
  }
};

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
  
  // 打字機效果狀態
  const [typewriterText, setTypewriterText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const blockquoteRef = useRef<HTMLQuoteElement | null>(null);
  const typewriterTimerRef = useRef<number | null>(null);
  const startHandleRef = useRef<PlaybackHandle | null>(null);
  const hasPlayedStartSoundRef = useRef<boolean>(false);
  // 滾動交互動態控制 PixelImage 背景（僅 pixelSize，避免不必要 re-render）
  const [scrollPixelSize, setScrollPixelSize] = useState<number>(1);
  const lastPixelRef = useRef<number>(1);
  
  // 特殊主圖滾動效果狀態（只需要 Parallax top 位置）
  const [specialHeadingImgTop, setSpecialHeadingImgTop] = useState<number>(-10); // vh 單位
  const specialHeadingImgRef = useRef<HTMLDivElement | null>(null);
  
  const overlayRef = useRef<HTMLDivElement | null>(null);
  // 注意：hero 高度現在由 CSS 直接設定為 75vh，不再需要 JavaScript 計算
  
  // Blockquote 完整文字（從 projectInfo.sections 中找到第一個 enableTypewriter 的 blockquote）
  const blockquoteFullText = useMemo(() => {
    if (!projectInfo?.sections) return '';
    for (const section of projectInfo.sections) {
      for (const content of section.content) {
        if (content.type === 'blockquote' && content.enableTypewriter) {
          return content.text;
        }
      }
    }
    return '';
  }, [projectInfo]);

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

  // 渲染專案區塊內容的函數
  const renderProjectSectionContent = useCallback((content: ProjectSectionContent, index: number, sectionIndex: number) => {
    const key = `section-${sectionIndex}-content-${index}`;
    
    switch (content.type) {
      case 'paragraph':
        // 處理包含 email 的段落
        const emailRegex = /(.*?)([\w.-]+@[\w.-]+\.[a-zA-Z]{2,})(.*)/;
        const emailMatch = content.text.match(emailRegex);
        
        if (emailMatch) {
          return (
            <p key={key}>
              {emailMatch[1]}
              <a 
                href={`mailto:${emailMatch[2]}`} 
                className="feed-detail-overlay__email-link"
              >
                {emailMatch[2]}
              </a>
              {emailMatch[3]}
            </p>
          );
        }
        
        return <p key={key}>{content.text}</p>;
      
      case 'quote':
        return (
          <p key={key}>
            <span className="feed-detail-overlay__quote-mark">&gt;</span>
            <span className="feed-detail-overlay__quote-text"> {content.text}</span>
          </p>
        );
      
      case 'blockquote':
        if (content.enableTypewriter) {
          return (
            <blockquote 
              key={key}
              ref={blockquoteRef}
              className="feed-detail-overlay__section-blockquote"
            >
              <span className="feed-detail-overlay__blockquote-mark">"</span>
              {typewriterText}
              {isTyping && <span className="feed-detail-overlay__cursor">_</span>}
              {!isTyping && typewriterText.length === blockquoteFullText.length && (
                <span className="feed-detail-overlay__blockquote-mark">"</span>
              )}
            </blockquote>
          );
        }
        return (
          <blockquote key={key} className="feed-detail-overlay__section-blockquote">
            <span className="feed-detail-overlay__blockquote-mark">"</span>
            {content.text}
            <span className="feed-detail-overlay__blockquote-mark">"</span>
          </blockquote>
        );
      
      case 'image':
        return (
          <div key={key} className="feed-detail-overlay__project-image">
            <DistortedPixels2D
              src={resolveImageSrc(content.src)}
              objectFit="responsive"
              direction="y"
              maxPixelation={80}
              maxDistortion={1}
              scrollSensitivity={0.2}
              decaySpeed={0.95}
              scrollContainer={scrollContentRef}
            />
          </div>
        );
      
      default:
        return null;
    }
  }, [typewriterText, isTyping, blockquoteFullText, scrollContentRef]);

  // 所有 useMemo hooks 必須在 early return 之前調用
  // 記憶化的樣式計算以減少重渲染
  const openStyle = useMemo(() => {
    return {
      '--feed-detail-primary-color': primaryColor,
      '--feed-detail-secondary-color': secondaryColor,
      ...style,
    } as React.CSSProperties;
  }, [primaryColor, secondaryColor, style]);

  // 穩定化背景屬性，避免每次 render 產生新物件造成子樹 re-render
  const computedBgProps = useMemo(() => ({
    ...backgroundProps,
    pixelSize: scrollPixelSize,
    // 保持背景為彩色且顯示 secondary 遮罩
    desaturateUntilHover: true,
    // 背景 PixelImage 一律視為 hovered 以使用 secondary 遮罩（expanding 階段也生效）
    hoverActive: true,
    hoverPixelToOne: false,
    // 若未提供 secondaryColor，避免落回 theme mask(白色)，改用 overlay 變數或深色備援
    maskColor: secondaryColor ?? 'var(--feed-detail-secondary-color, rgba(0,0,0,0.9))',
    maskOpacity: backgroundProps?.maskOpacity ?? 0.9,
  }), [backgroundProps, scrollPixelSize, secondaryColor]);

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

  // 合併滾動效果處理：pixelSize 與 parallax 一起更新
  // 使用單一監聽器和批次更新來減少重渲染
  useEffect(() => {
    if (!open || !scrollContentRef.current) return;
    const el = scrollContentRef.current;
    let rafId: number | null = null;
    let lastTop = -10;

    const updateScrollEffects = (scrollTop: number) => {
      // 更新背景 pixelSize（僅在有效整數變化時更新以降低 re-render）
      const clamped = Math.max(0, Math.min(400, scrollTop)) / 400;
      const pixelSize = 1 + clamped * 79; // 1 → 80
      const effectivePixel = Math.max(1, Math.round(pixelSize));
      
      // 更新 parallax 位置
      const parallaxOffset = scrollTop * 0.7; // 視差速度為 50%
      const topPosition = -10 - (parallaxOffset / window.innerHeight * 100); // 轉換為 vh
      
      // 僅在 pixel 整數變化時更新，避免頻繁 re-render
      if (effectivePixel !== lastPixelRef.current) {
        lastPixelRef.current = effectivePixel;
        setScrollPixelSize(effectivePixel);
      }
      // 降低 parallax setState 次數
      if (Math.abs(topPosition - lastTop) > 0.2) {
        lastTop = topPosition;
        setSpecialHeadingImgTop(topPosition);
      }
    };

    const onScroll = () => {
      if (rafId !== null) return;
      
      const scrollTop = el.scrollTop;
      rafId = requestAnimationFrame(() => {
        updateScrollEffects(scrollTop);
        rafId = null;
      });
    };

    // 初始化
    updateScrollEffects(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      el.removeEventListener('scroll', onScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
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
      hasPlayedStartSoundRef.current = false;
      // 停止播放中的音效
      startHandleRef.current?.stop();
      // 重置打字機效果
      setTypewriterText('');
      setIsTyping(false);
      if (typewriterTimerRef.current) {
        cancelAnimationFrame(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
      // 重置特殊主圖狀態
      setSpecialHeadingImgTop(-10);
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
  }, [open, playStartSound, blockquoteFullText]);

  // 打字機效果的 IntersectionObserver
  useEffect(() => {
    if (!open || !blockquoteRef.current || animationPhase !== 'ready') return;

    let hasTriggered = false;
    let timerId: number | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 只要元素進入視窗且未觸發過就開始打字
          if (entry.isIntersecting && !hasTriggered) {
            hasTriggered = true;
            setIsTyping(true);
            setTypewriterText(''); // 重置文字
            
            // 使用閉包外的索引來避免閉包問題
            let currentIndex = 0;
            
            const typeCharacter = () => {
              currentIndex++;
              setTypewriterText(blockquoteFullText.substring(0, currentIndex));
              
              if (currentIndex < blockquoteFullText.length) {
                timerId = window.setTimeout(typeCharacter, 30);
              } else {
                setIsTyping(false);
                timerId = null;
              }
            };
            
            // 立即開始第一個字符
            typeCharacter();
          }
        });
      },
      {
        root: null, // 使用 viewport
        threshold: 0.2, // 當 20% 可見時觸發
      }
    );

    observer.observe(blockquoteRef.current);

    return () => {
      observer.disconnect();
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
    };
  }, [open, blockquoteFullText, animationPhase]);

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
            backgroundProps={computedBgProps}
            secondaryColor={secondaryColor}
            className="feed-detail-overlay__background-card"
            enableHoverSound={false}
            // 復原 FeedCard 本身的 hover 視覺：不強制 hovered，不禁用 hover
            forceHovered={false}
            disableHover={false}
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

        {/* 特殊主圖 - 從 projectInfo 讀取 */}
        {animationPhase === 'ready' && projectInfo?.specialHeadingImage && (
          <div 
            ref={specialHeadingImgRef}
            className="feed-detail-overlay__special-heading"
            style={{
              top: `${specialHeadingImgTop}vh`,
              transform: 'translateZ(0)',
            }}
          >
            <img 
              src={resolveImageSrc(projectInfo.specialHeadingImage)}
              alt="Project Heading" 
              className="feed-detail-overlay__special-heading-img"
            />
          </div>
        )}

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
                  {projectInfo.project && (
                    <div className="feed-detail-overlay__meta-item">
                      <h3 className="feed-detail-overlay__meta-label">Project</h3>
                      <p className="feed-detail-overlay__meta-value">{projectInfo.project}</p>
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
                  <CTAButton
                    href={projectInfo.websiteUrl}
                    label={projectInfo.websiteLabel || 'VISIT WEBSITE'}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                  />
                )}
              </aside>
              
              <div className="feed-detail-overlay__project-content">
                {projectInfo.description && (
                  <p className="feed-detail-overlay__project-description">
                    {projectInfo.description}
                  </p>
                )}
                
                {/* 第一張主圖 - 從 projectInfo 讀取 */}
                {projectInfo.mainImage && (
                  <div className="feed-detail-overlay__project-image">
                    <DistortedPixels2D
                      src={resolveImageSrc(projectInfo.mainImage)}
                      objectFit="responsive"
                      direction="y"
                      maxPixelation={80}
                      maxDistortion={1}
                      scrollSensitivity={0.2}
                      decaySpeed={0.95}
                      scrollContainer={scrollContentRef}
                    />
                  </div>
                )}

                {/* 動態渲染專案區塊 */}
                {projectInfo.sections && projectInfo.sections.map((section, sectionIndex) => (
                  <div key={`section-${sectionIndex}`} className="feed-detail-overlay__project-section">
                    {/* Section 標題 */}
                    <h2 className="feed-detail-overlay__section-title">
                      {section.title}<span className="feed-detail-overlay__cursor">_</span>
                    </h2>

                    {/* Section 內容 */}
                    <div className="feed-detail-overlay__section-content">
                      {section.content.map((content, contentIndex) => {
                        // quote 需要包在 section-quote div 中
                        if (content.type === 'quote') {
                          // 收集連續的 quote
                          const quotes: Array<{ type: 'quote'; text: string }> = [];
                          let idx = contentIndex;
                          while (idx < section.content.length && section.content[idx].type === 'quote') {
                            const quoteContent = section.content[idx];
                            if (quoteContent.type === 'quote') {
                              quotes.push(quoteContent);
                            }
                            idx++;
                          }
                          
                          // 只在第一個 quote 時渲染整組
                          if (contentIndex === 0 || section.content[contentIndex - 1].type !== 'quote') {
                            return (
                              <div key={`quote-group-${contentIndex}`} className="feed-detail-overlay__section-quote">
                                {quotes.map((quote, quoteIdx) => (
                                  <p key={`quote-${contentIndex}-${quoteIdx}`}>
                                    <span className="feed-detail-overlay__quote-mark">&gt;</span>
                                    <span className="feed-detail-overlay__quote-text"> {quote.text}</span>
                                  </p>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }
                        
                        return renderProjectSectionContent(content, contentIndex, sectionIndex);
                      })}
                    </div>
                  </div>
                ))}
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


