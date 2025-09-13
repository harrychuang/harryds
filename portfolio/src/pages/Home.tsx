import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import './Home.scss';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo, FeedDetailOverlay, PixelText } from 'hds';
import type { FeedCardSize } from 'hds';
import type { FeedItem, FeedContentBlock } from '../../../harryds/src/types/feed';
import { useStrapiFeed } from '../hooks/useStrapiFeed';
import hoverSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep.mp3';
import clickSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep 3.mp3';
import { audioManager, type PlaybackHandle } from '../../../harryds/src/utils/audioManager';
import { useSmartPreload, usePreloadDebug } from '../hooks/useSmartPreload';
import { useTheme } from '../theme/useTheme';

const slugify = (text: string) => text
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-');

const Home: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { items: strapiItems, loading, error } = useStrapiFeed();
  const items = useMemo(() => strapiItems as FeedItem[], [strapiItems]);
  
  // 調試信息：顯示資料載入狀態
  useEffect(() => {
    console.log('[Home] 資料載入狀態:', { loading, error, itemCount: items.length });
    if (items.length > 0) {
      console.log('[Home] 第一個項目圖片:', items[0].heroImage);
    }
  }, [loading, error, items]);
  const { log } = usePreloadDebug();
  const { theme, toggleTheme } = useTheme();

  // 智能預載配置
  const preloadConfig = useMemo(() => ({
    hoverDelay: 300,      // 300ms 後開始預載
    timeout: 5000,        // 5秒超時
    enabled: true,        // 啟用預載
    maxConcurrent: 2,     // 最多同時預載 2 個
  }), []);

  const {
    onHoverStart,
    onHoverEnd,
    isPreloaded,
    getStats,
    clearCache
  } = useSmartPreload(preloadConfig);

  const [openCardId, setOpenCardId] = useState<number | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);
  const [openCardAnimationPhase, setOpenCardAnimationPhase] = useState<'closed' | 'loading' | 'positioning' | 'expanding' | 'ready'>('closed');
  const [isLogoHovered, setIsLogoHovered] = useState<boolean>(false);
  const loadedCardIdsRef = useRef<Set<number>>(new Set());

  // 導覽選單 hover 觸發一次動畫狀態
  const [menuAnimStates, setMenuAnimStates] = useState<Record<string, boolean>>({});
  const menuHoverTimersRef = useRef<Record<string, number>>({});
  const triggerMenuHoverOnce = useCallback((key: string) => {
    // 若已在動畫中就不重複觸發
    if (menuAnimStates[key]) return;
    setMenuAnimStates((prev) => ({ ...prev, [key]: true }));
    // 預設動畫總時長，完成後重置為 false 以便再次觸發
    const DURATION = 1200;
    if (menuHoverTimersRef.current[key]) {
      clearTimeout(menuHoverTimersRef.current[key]);
    }
    menuHoverTimersRef.current[key] = window.setTimeout(() => {
      setMenuAnimStates((prev) => ({ ...prev, [key]: false }));
      delete menuHoverTimersRef.current[key];
    }, DURATION);
  }, [menuAnimStates]);

  useEffect(() => {
    return () => {
      Object.values(menuHoverTimersRef.current).forEach((id) => clearTimeout(id));
      menuHoverTimersRef.current = {};
    };
  }, []);

  // 性能統計顯示（僅開發環境）
  const [showStats, setShowStats] = useState(false);
  const statsInterval = useRef<number>();

  const originalHomeBackgroundRef = useRef<string>('');
  const homeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const staggerTimeoutsRef = useRef<number[]>([]);

  const logoHoverHandleRef = useRef<PlaybackHandle | null>(null);
  const logoClickHandleRef = useRef<PlaybackHandle | null>(null);
  const hasPlayedLogoHoverSoundRef = useRef<boolean>(false);
  const hasPlayedLogoClickSoundRef = useRef<boolean>(false);
  const menuHoverHandleRef = useRef<PlaybackHandle | null>(null);
  const menuClickHandleRef = useRef<PlaybackHandle | null>(null);

  useEffect(() => {
    // 只有在開發環境且明確啟用調試時才顯示統計
    if (process.env.NODE_ENV === 'development' && import.meta.env.VITE_PRELOAD_DEBUG === 'true') {
      statsInterval.current = window.setInterval(() => {
        const stats = getStats();
        log('預載統計', stats);
      }, 10000); // 改為 10 秒顯示一次，減少干擾

      return () => {
        if (statsInterval.current) {
          clearInterval(statsInterval.current);
        }
      };
    }
  }, [getStats, log]);

  useEffect(() => {
    if (!originalHomeBackgroundRef.current && homeRef.current) {
      originalHomeBackgroundRef.current = getComputedStyle(homeRef.current).backgroundColor || 'var(--hds-sys-color-on-theme-surface)';
    }
  }, []);

  useEffect(() => {
    if (!homeRef.current) return;
    const activeCardId = (openCardId && openCardAnimationPhase === 'loading') ? openCardId : (openCardId || hoveredCardId);
    if (activeCardId) {
      const activeItem = items.find(item => item.id === activeCardId);
      if (activeItem && activeItem.secondaryColor) {
        homeRef.current.style.backgroundColor = activeItem.secondaryColor;
        homeRef.current.style.transition = 'background-color 0.3s ease';
      }
    } else {
      homeRef.current.style.backgroundColor = '';
      homeRef.current.style.transition = 'background-color 0.3s ease';
    }
  }, [openCardId, hoveredCardId, openCardAnimationPhase, items]);

  useEffect(() => {
    audioManager.preload(hoverSoundUrl).catch(() => {});
  }, []);
  useEffect(() => {
    audioManager.preload(clickSoundUrl).catch(() => {});
  }, []);

  const playLogoHoverSound = useCallback(async () => {
    if (hasPlayedLogoHoverSoundRef.current) return;
    if (!(openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready'))) return;
    try {
      logoHoverHandleRef.current?.stop();
      logoHoverHandleRef.current = await audioManager.play(hoverSoundUrl, { volume: 0.4 });
      hasPlayedLogoHoverSoundRef.current = true;
    } catch (err) {
      console.warn('Logo hover sound play failed:', err);
    }
  }, [openCardId, openCardAnimationPhase]);

  const playLogoClickSound = useCallback(async () => {
    if (hasPlayedLogoClickSoundRef.current) return;
    if (!(openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready'))) return;
    try {
      logoClickHandleRef.current?.stop();
      logoClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
      hasPlayedLogoClickSoundRef.current = true;
    } catch (err) {
      console.warn('Logo click sound play failed:', err);
    }
  }, [openCardId, openCardAnimationPhase]);

  const handleLogoHover = useCallback(() => {
    if (openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready')) {
      setIsLogoHovered(true);
      hasPlayedLogoHoverSoundRef.current = false;
      playLogoHoverSound();
    }
  }, [playLogoHoverSound, openCardId, openCardAnimationPhase]);

  const handleLogoLeave = useCallback(() => {
    setIsLogoHovered(false);
  }, []);

  const playMenuHoverSound = useCallback(async () => {
    try {
      menuHoverHandleRef.current?.stop();
      menuHoverHandleRef.current = await audioManager.play(hoverSoundUrl, { volume: 0.4 });
    } catch (err) {
      console.warn('Menu hover sound play failed:', err);
    }
  }, []);

  const playMenuClickSound = useCallback(async () => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Menu click sound play failed:', err);
    }
  }, []);

  const toItemUrl = useCallback((item: FeedItem) => {
    const slug = slugify(item.heading);
    return `/${item.category}/${item.id}/${slug}`;
  }, []);

  const handleOpenCard = useCallback((cardId: number) => {
    const item = items.find(i => i.id === cardId);
    if (!item) return;
    navigate(toItemUrl(item), { replace: false });
  }, [items, navigate, toItemUrl]);

  const handleCloseCard = useCallback(() => {
    setOpenCardId(null);
    setOpenCardAnimationPhase('closed');
    setHoveredCardId(null);
    setIsLogoHovered(false);
    hasPlayedLogoHoverSoundRef.current = false;
    hasPlayedLogoClickSoundRef.current = false;
    logoHoverHandleRef.current?.stop();
    logoClickHandleRef.current?.stop();
    navigate('/', { replace: false });
  }, [navigate]);

  const handleLogoClick = useCallback(() => {
    hasPlayedLogoClickSoundRef.current = false;
    playLogoClickSound();
    if (openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready')) {
      setTimeout(() => {
        handleCloseCard();
      }, 500);
    }
  }, [playLogoClickSound, openCardId, openCardAnimationPhase, handleCloseCard]);

  const handleAnimationPhaseChange = useCallback((phase: 'closed' | 'loading' | 'positioning' | 'expanding' | 'ready') => {
    console.log(`Animation phase changed to: ${phase}, openCardId: ${openCardId}`);
    setOpenCardAnimationPhase(phase);
    // 當動畫到達 ready 階段時，記錄該卡片已載入過
    if (phase === 'ready' && openCardId != null) {
      console.log(`Adding card ${openCardId} to loaded set`);
      loadedCardIdsRef.current.add(openCardId);
      console.log(`Loaded cards after add:`, Array.from(loadedCardIdsRef.current));
    }
  }, [openCardId]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    staggerTimeoutsRef.current.forEach((id) => clearTimeout(id));
    staggerTimeoutsRef.current = [];
    root.querySelectorAll<HTMLElement>('.pg-card.dimmed').forEach((el) => el.classList.remove('dimmed'));
    root.classList.remove('js-stagger-mode');

    if (openCardId && openCardAnimationPhase === 'loading') {
      root.classList.add('js-stagger-loading');
      const cards = Array.from(root.querySelectorAll<HTMLElement>('.pg-card'));
      const others = cards.filter((el) => Number(el.dataset.id) !== openCardId);
      const stepMs = 25;
      others.forEach((el, i) => {
        const t = window.setTimeout(() => {
          el.classList.add('dimmed');
        }, i * stepMs);
        staggerTimeoutsRef.current.push(t);
      });
    } else {
      root.classList.remove('js-stagger-loading');
      if (!openCardId && hoveredCardId) {
        root.classList.add('js-stagger-mode');
        const targetId = hoveredCardId;
        const cards = Array.from(root.querySelectorAll<HTMLElement>('.pg-card'));
        const others = cards.filter((el) => Number(el.dataset.id) !== targetId && el.dataset.open !== 'true');
        const stepMs = 25;
        others.forEach((el, i) => {
          const t = window.setTimeout(() => {
            el.classList.add('dimmed');
          }, i * stepMs);
          staggerTimeoutsRef.current.push(t);
        });
      }
    }
  }, [openCardId, openCardAnimationPhase, hoveredCardId]);

  const handleCardHover = useCallback((cardId: number) => {
    if (openCardId) return;
    
    // 開始智能預載
    onHoverStart(cardId);
    log(`開始預載卡片 ${cardId}`);
    
    // 原有的 hover 邏輯
    setHoveredCardId(cardId);
    const root = contentRef.current;
    if (!root) return;
    staggerTimeoutsRef.current.forEach((id) => clearTimeout(id));
    staggerTimeoutsRef.current = [];
    root.classList.remove('js-stagger-loading');
    root.classList.add('js-stagger-mode');
    root.querySelectorAll<HTMLElement>('.pg-card.dimmed').forEach((el) => el.classList.remove('dimmed'));
    const cards = Array.from(root.querySelectorAll<HTMLElement>('.pg-card'));
    const others = cards.filter((el) => Number(el.dataset.id) !== cardId && el.dataset.open !== 'true');
    const stepMs = 25;
    others.forEach((el, i) => {
      const t = window.setTimeout(() => {
        el.classList.add('dimmed');
      }, i * stepMs);
      staggerTimeoutsRef.current.push(t);
    });
  }, [openCardId, onHoverStart, log]);

  const handleCardLeave = useCallback(() => {
    // 取消預載
    if (hoveredCardId) {
      onHoverEnd(hoveredCardId);
      log(`取消預載卡片 ${hoveredCardId}`);
    }
    
    // 原有的 leave 邏輯
    setHoveredCardId(null);
    const root = contentRef.current;
    if (!root) return;
    staggerTimeoutsRef.current.forEach((id) => clearTimeout(id));
    staggerTimeoutsRef.current = [];
    root.classList.remove('js-stagger-mode');
    root.querySelectorAll<HTMLElement>('.pg-card.dimmed').forEach((el) => el.classList.remove('dimmed'));
  }, [hoveredCardId, onHoverEnd, log]);

  const logoColors = useMemo(() => {
    const activeCardId = openCardId || hoveredCardId;
    if (activeCardId) {
      const activeItem = items.find(item => item.id === activeCardId);
      if (activeItem && activeItem.primaryColor && activeItem.secondaryColor) {
        return {
          primaryColor: activeItem.primaryColor,
          secondaryColor: activeItem.secondaryColor,
        } as any;
      }
    }
    return {} as any;
  }, [openCardId, hoveredCardId, items]);

  const logoKey = useMemo(() => {
    const logoType = openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready') ? 'back' : 'default';
    const hasCustomColors = openCardId || hoveredCardId;
    const isAnimated = logoType === 'back' ? isLogoHovered : true;
    return `${logoType}-${hasCustomColors ? 'custom' : 'default'}-${isAnimated ? 'animated' : 'static'}`;
  }, [openCardId, hoveredCardId, openCardAnimationPhase, isLogoHovered]);

  const getSizeByIndex = (index: number): FeedCardSize => {
    if (index === 0) return 'hero';
    if (index <= 2) return 'med';
    if (index <= 5) return 'sm';
    return 'xs';
  };

  // 由於現在完全使用 Strapi 資料，不再需要本地圖片處理
  // strapiClient.ts 中的 resolveMediaUrl 已經處理了所有圖片 URL
  const resolveSrc = (url?: string) => {
    // 直接返回 strapiClient 處理過的 URL，不做任何額外處理
    return url || '';
  };

  useEffect(() => {
    // 將 URL 狀態反映到 openCardId
    const idParam = params.id; // 單獨的 id
    const category = params.category as 'article' | 'project' | undefined;
    if (!idParam || !category) {
      setOpenCardId(null);
      return;
    }
    const id = Number(idParam);
    if (!id || Number.isNaN(id)) {
      setOpenCardId(null);
      return;
    }
    const item = items.find(i => i.id === id && i.category === category);
    if (item) {
      setOpenCardId(item.id);
    } else {
      setOpenCardId(null);
    }
  }, [params.id, params.category, items]);

  // 🎯 開發環境的性能統計面板
  const renderDebugPanel = () => {
    if (process.env.NODE_ENV !== 'development') return null;

    const stats = getStats();
    
    return (
      <div 
        className="debug-panel"
        style={{
          position: 'fixed',
          top: 10,
          left: 10,
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 9999,
          display: showStats ? 'block' : 'none'
        }}
      >
        <div><strong>🎯 智能預載統計</strong></div>
        <div>預載完成: {stats.preloadCount}</div>
        <div>快取命中: {stats.cacheHits}</div>
        <div>取消次數: {stats.cancelledCount}</div>
        <div>命中率: {stats.hitRate}</div>
        <div>平均時間: {stats.avgPreloadTime.toFixed(0)}ms</div>
        <div>進行中: {stats.activeCount}</div>
        <div>隊列長度: {stats.queueLength}</div>
        <div>快取大小: {stats.cacheSize}</div>
        <button 
          onClick={() => clearCache()}
          style={{
            marginTop: '5px',
            padding: '2px 6px',
            fontSize: '10px',
            background: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer'
          }}
        >
          清除快取
        </button>
      </div>
    );
  };

  return (
    <div ref={homeRef} className="home">
      {renderDebugPanel()}
      
      {/* 開發環境的統計切換按鈕 */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => setShowStats(!showStats)}
          style={{
            position: 'fixed',
            bottom: 10,
            left: 10,
            padding: '5px 10px',
            background: '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            zIndex: 9998
          }}
        >
          {showStats ? '隱藏' : '顯示'} 預載統計
        </button>
      )}

      <header className="home__header">
        <div className="header-content">
          <div 
            onClick={handleLogoClick}
            onMouseEnter={handleLogoHover}
            onMouseLeave={handleLogoLeave}
            className="logo-wrapper"
            style={{
              cursor: openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready') ? 'pointer' : 'default',
              transform: openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready') ? 'translateX(-10px)' : 'translateX(0px)'
            }}
          >
            <Logo 
              key={logoKey}
              type={openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready') ? 'back' : 'default'}
              animated={openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready') ? isLogoHovered : true}
              {...logoColors}
            />
          </div>
          <nav className="home__nav">
            {['home', 'project', 'article', 'about'].map((item) => {
              const menuText = t(`nav.${item}`);
              // 精確計算寬度：基於 PixelText 內部算法
              // 每個字符 = CHAR_WIDTH(8) * pixelSize(2) = 16px
              // 字符間距 = letterSpacing(1) * pixelSize(2) = 2px  
              // 總寬度 = 字符數 * 16 + (字符數-1) * 2
              const charCount = menuText.length;
              const calculatedWidth = charCount * 16 + Math.max(0, charCount - 1) * 2;
              
              return (
                <div
                  key={item}
                  className="home__nav-item"
                  onMouseEnter={() => { triggerMenuHoverOnce(item); playMenuHoverSound(); }}
                  onClick={() => { playMenuClickSound(); }}
                >
                  <PixelText
                    text={menuText}
                    textEnabled
                    pixelSize={2}
                    width={calculatedWidth}
                    height={24}
                    animated={!!menuAnimStates[item]}
                    totalAnimationDuration={400}
                    primaryColor={(logoColors as any).primaryColor}
                    onPrimaryColor={(logoColors as any).secondaryColor}
                  />
                </div>
              );
            })}
            {/* Theme toggle button using PixelText text-box with sun/moon */}
            <div className="home__nav-item">
              <div
                role="button"
                tabIndex={0}
                onClick={() => { playMenuClickSound(); toggleTheme(); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleTheme();
                  }
                }}
                onMouseEnter={() => { playMenuHoverSound(); }}
                aria-label="切換主題"
                title={theme === 'dark' ? '切換為亮色' : '切換為暗色'}
                className="theme-toggle"
                style={{ borderColor: ((logoColors as any).primaryColor) || 'var(--hds-sys-color-theme-surface)' }}
              >
                <PixelText
                  text={theme === 'dark' ? '☽' : '☀'}
                  textEnabled
                  pixelSize={2}
                  letterSpacing={0}
                  width={36}
                  height={36}
                  animated={false}
                  primaryColor={(logoColors as any).primaryColor}
                  onPrimaryColor={(logoColors as any).secondaryColor}
                />
              </div>
            </div>
          </nav>
        </div>
      </header>
      <div className="home__container">
        <div
          className="home__content"
          data-phase={openCardAnimationPhase}
          data-open-id={openCardId ?? undefined}
          data-hover-id={hoveredCardId ?? undefined}
          ref={contentRef}
        >
        {items.slice(0, 9).map((item, index) => {
          const size = getSizeByIndex(index);
          const src = resolveSrc(item.heroImage);
          console.log(`[Home] 項目 ${item.id} 圖片處理:`, { 
            original: item.heroImage, 
            resolved: src,
            hasImage: !!src
          });
            const rawBlocks: FeedContentBlock[] | undefined =
              Array.isArray(item.content)
                ? (item.content as FeedContentBlock[])
                : (typeof item.content === 'string'
                    ? ([{ type: 'paragraph', content: item.content }] as FeedContentBlock[])
                    : undefined);
            const resolvedBlocks = rawBlocks
              ? rawBlocks.map((b) => {
                  if (b.type === 'image') {
                    return { ...b, src: resolveSrc(b.src) };
                  }
                  if (b.type === 'video') {
                    return { 
                      ...b, 
                      src: resolveSrc(b.src),
                      poster: b.poster ? resolveSrc(b.poster) : undefined
                    };
                  }
                  return b;
                })
              : undefined;
            
            // 當 hover 或打開時顯示 brand，否則顯示 id
            const displayId = ((hoveredCardId === item.id || openCardId === item.id) && item.brand) ? item.brand : item.id;
            
            // 🚀 關鍵優化：使用預載狀態決定初始階段
            const initialPhase = (() => {
              const hasLoaded = loadedCardIdsRef.current.has(item.id);
              const hasPreloaded = isPreloaded(item.id);
              
              if (hasLoaded) {
                log(`卡片 ${item.id} 已完全載入，直接顯示 ready`);
                return 'ready';
              } else if (hasPreloaded) {
                log(`卡片 ${item.id} 已預載，跳過 loading 動畫`);
                return 'expanding';
              } else {
                log(`卡片 ${item.id} 未預載，顯示 loading 動畫`);
                return 'loading';
              }
            })();
            
            return (
              <div 
                key={item.id} 
                className={`pg-card pg-card--${size}`.trim()}
                data-id={item.id}
                data-open={openCardId === item.id ? 'true' : undefined}
                data-preloaded={isPreloaded(item.id) ? 'true' : undefined}
                onClick={() => handleOpenCard(item.id)}
                onMouseEnter={() => handleCardHover(item.id)}
                onMouseLeave={handleCardLeave}
                style={{ 
                  cursor: 'pointer', 
                  ['--stagger-index' as any]: index
                } as React.CSSProperties}
              >
                <FeedDetailOverlay
                  open={openCardId === item.id}
                  onClose={handleCloseCard}
                  onAnimationPhaseChange={openCardId === item.id ? handleAnimationPhaseChange : undefined}
                  src={src}
                  sizeWhenClosed={size}
                  padding={40}
                  backgroundProps={{ 
                    pixelSize: size === 'hero' ? 80 : size === 'med' ? 70 : size === 'sm' ? 60 : 50,
                    hoverPixelToOne: true,
                    hoverPixelDuration: 500,
                    desaturateUntilHover: true,
                    objectFit: 'cover'
                  }}
                  secondaryColor={item.secondaryColor}
                  infoMaxWidth={1600}
                  infoData={{ id: displayId, heading: item.heading, date: item.date, tags: item.tags, category: item.category }}
                  primaryColor={item.primaryColor}
                  contentBlocks={resolvedBlocks}
                  use2D={size === 'xs'}
                  initialPhase={initialPhase}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;


