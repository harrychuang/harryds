import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import './Home.scss';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo, FeedDetailOverlay, PixelText, PixelText2D } from 'hds';
import type { FeedCardSize } from 'hds';
import type { FeedItem, FeedContentBlock } from '../../../harryds/src/types/feed';
import { useStrapiFeed } from '../hooks/useStrapiFeed';
import hoverSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep.mp3';
import clickSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep 3.mp3';
import { audioManager, type PlaybackHandle } from '../../../harryds/src/utils/audioManager';
import { useSmartPreload } from '../hooks/useSmartPreload';
import { useTheme } from '../theme/useTheme';
import { useHover } from '../contexts/HoverContext';
import { useOverlay } from '../contexts/OverlayContext';
import TransitionOverlay from '../components/TransitionOverlay';

const slugify = (text: string) => text
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-');

const Home: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { items: strapiItems, loading, error } = useStrapiFeed();
  const items = useMemo(() => strapiItems as FeedItem[], [strapiItems]);
  
  // 調試信息：顯示資料載入狀態
  useEffect(() => {
    console.log('[Home] 資料載入狀態:', { loading, error, itemCount: items.length });
    if (items.length > 0) {
      console.log('[Home] 第一個項目圖片:', items[0].heroImage);
    }
  }, [loading, error, items]);
  const log = useCallback((..._args: any[]) => {}, []);
  const { theme, toggleTheme } = useTheme();
  const { hoveredCardId, setHoveredCardId } = useHover();
  const { 
    setOpenCardId: setContextOpenCardId, 
    setAnimationPhase: setContextAnimationPhase, 
    overlayScrollRef,
    isTransitioning,
    setIsTransitioning,
    transitionClickPosition,
    setTransitionClickPosition,
    transitionColor,
    setTransitionColor,
    shouldStartDisappear,
    setShouldStartDisappear,
  } = useOverlay();

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
  const [openCardAnimationPhase, setOpenCardAnimationPhase] = useState<'closed' | 'loading' | 'positioning' | 'expanding' | 'ready'>('closed');
  const [isLogoHovered, setIsLogoHovered] = useState<boolean>(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);
  const loadedCardIdsRef = useRef<Set<number>>(new Set());
  const pendingTransitionRef = useRef<{ cardId: number; clickPosition: { x: number; y: number } | null } | null>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

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

  // 預載調試面板已移除

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

  // 預載統計輪詢已移除

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

  // 語言切換相關
  const languageMap = useMemo(() => ({
    'zh-Hant': 'ZH',
    'zh': 'ZH',
    'en': 'EN',
    'ja': 'JP'
  }), []);

  const currentLangDisplay = useMemo(() => {
    return languageMap[i18n.language as keyof typeof languageMap] || 'EN';
  }, [i18n.language, languageMap]);

  const handleLanguageChange = useCallback((lang: string) => {
    i18n.changeLanguage(lang);
    setIsLangDropdownOpen(false);
    playMenuClickSound();
  }, [i18n, playMenuClickSound]);

  const toggleLangDropdown = useCallback(() => {
    setIsLangDropdownOpen(prev => !prev);
    playMenuClickSound();
  }, [playMenuClickSound]);

  // 點擊外部關閉 dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };

    if (isLangDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLangDropdownOpen]);

  const toItemUrl = useCallback((item: FeedItem) => {
    const slug = slugify(item.heading);
    return `/${item.category}/${item.id}/${slug}`;
  }, []);

  const handleOpenCard = useCallback((cardId: number, event?: React.MouseEvent) => {
    // 如果已經有卡片開啟或正在轉場中，直接返回（避免重複觸發）
    if (openCardId !== null || isTransitioning) {
      console.log('[Home] 阻止重複開啟卡片，當前狀態:', { openCardId, isTransitioning });
      return;
    }
    
    const item = items.find(i => i.id === cardId);
    if (!item) return;
    
    console.log('[Home] 開啟卡片:', cardId);
    
    // 保存卡片資訊，用於載入完成後的判斷
    const clickPos = event ? { x: event.clientX, y: event.clientY } : null;
    pendingTransitionRef.current = { cardId, clickPosition: clickPos };
    
    // 設置轉場顏色為卡片的主色
    setTransitionColor(item.primaryColor || '#000000');
    
    // 設置點擊位置
    if (clickPos) {
      setTransitionClickPosition(clickPos);
    } else {
      setTransitionClickPosition({ 
        x: window.innerWidth / 2, 
        y: window.innerHeight / 2 
      });
    }
    
    // 重置消失狀態
    setShouldStartDisappear(false);
    
    // 立即播放轉場動畫（擴展階段）
    setIsTransitioning(true);
    
    // 延遲一小段時間再導航，確保動畫已經開始
    setTimeout(() => {
      navigate(toItemUrl(item), { replace: false });
    }, 50);
  }, [openCardId, isTransitioning, items, navigate, toItemUrl, setTransitionColor, setTransitionClickPosition, setShouldStartDisappear, setIsTransitioning]);

  const handleCloseCard = useCallback(() => {
    console.log('[Home] 關閉卡片');
    setOpenCardId(null);
    setContextOpenCardId(null); // 同步更新 Context
    setOpenCardAnimationPhase('closed');
    setContextAnimationPhase('closed'); // 同步更新 Context
    setHoveredCardId(null);
    setIsLogoHovered(false);
    hasPlayedLogoHoverSoundRef.current = false;
    hasPlayedLogoClickSoundRef.current = false;
    logoHoverHandleRef.current?.stop();
    logoClickHandleRef.current?.stop();
    
    // 重置轉場動畫狀態
    setIsTransitioning(false);
    setShouldStartDisappear(false);
    pendingTransitionRef.current = null;
    
    navigate('/', { replace: false });
  }, [navigate, setContextOpenCardId, setContextAnimationPhase, setIsTransitioning, setShouldStartDisappear]);

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
    setContextAnimationPhase(phase); // 同步更新 Context
    // 當動畫到達 ready 階段時，記錄該卡片已載入過
    if (phase === 'ready' && openCardId != null) {
      console.log(`Adding card ${openCardId} to loaded set`);
      loadedCardIdsRef.current.add(openCardId);
      console.log(`Loaded cards after add:`, Array.from(loadedCardIdsRef.current));
    }
  }, [openCardId, setContextAnimationPhase]);

  // 監聽動畫階段變化，當內容載入完成（ready）時開始消失動畫
  useEffect(() => {
    if (openCardAnimationPhase === 'ready' && pendingTransitionRef.current) {
      const { cardId } = pendingTransitionRef.current;
      
      // 確認是同一張卡片
      if (cardId === openCardId) {
        console.log('[Home] 內容載入完成，開始消失動畫');
        
        // 通知轉場動畫可以開始消失了
        setShouldStartDisappear(true);
        
        // 清除待處理的轉場
        pendingTransitionRef.current = null;
      }
    }
  }, [openCardAnimationPhase, openCardId, setShouldStartDisappear]);

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
      setContextOpenCardId(null); // 同步更新 Context
      return;
    }
    const id = Number(idParam);
    if (!id || Number.isNaN(id)) {
      setOpenCardId(null);
      setContextOpenCardId(null); // 同步更新 Context
      return;
    }
    const item = items.find(i => i.id === id && i.category === category);
    if (item) {
      setOpenCardId(item.id);
      setContextOpenCardId(item.id); // 同步更新 Context
    } else {
      setOpenCardId(null);
      setContextOpenCardId(null); // 同步更新 Context
    }
  }, [params.id, params.category, items, setContextOpenCardId]);

  // 調試面板已移除

  return (
    <div ref={homeRef} className="home">
      {/* 預載統計面板與切換按鈕已移除 */}

      <header className="home__header">
        <div className="header-content">
          <div 
            onClick={handleLogoClick}
            onMouseEnter={handleLogoHover}
            onMouseLeave={handleLogoLeave}
            className="logo-wrapper"
            style={{
              cursor: openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready') ? 'pointer' : 'auto',
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
                  <PixelText2D
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
            {/* Theme toggle button using PixelText2D (2D Canvas, no WebGL) */}
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
                <PixelText2D
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
            
            {/* Language toggle button */}
            <div className="home__nav-item" ref={langDropdownRef}>
              <div
                role="button"
                tabIndex={0}
                onClick={toggleLangDropdown}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleLangDropdown();
                  }
                }}
                onMouseEnter={() => { playMenuHoverSound(); }}
                aria-label="切換語言"
                title="切換語言"
                className="lang-toggle"
                style={{ borderColor: ((logoColors as any).primaryColor) || 'var(--hds-sys-color-theme-surface)' }}
              >
                <PixelText2D
                  text={currentLangDisplay}
                  textEnabled
                  pixelSize={2}
                  letterSpacing={0}
                  width={32}
                  height={24}
                  animated={false}
                  primaryColor={(logoColors as any).primaryColor}
                  onPrimaryColor={(logoColors as any).secondaryColor}
                />
              </div>
              
              {/* Dropdown menu */}
              {isLangDropdownOpen && (
                <div className="lang-dropdown">
                  {[
                    { code: 'en', label: 'EN' },
                    { code: 'zh-Hant', label: 'ZH' },
                    { code: 'ja', label: 'JP' }
                  ].map((lang) => (
                    <div
                      key={lang.code}
                      className={`lang-dropdown__item ${i18n.language === lang.code ? 'active' : ''}`}
                      onClick={() => handleLanguageChange(lang.code)}
                      onMouseEnter={() => { playMenuHoverSound(); }}
                      style={{ 
                        borderColor: ((logoColors as any).primaryColor) || 'var(--hds-sys-color-theme-surface)',
                        backgroundColor: i18n.language === lang.code 
                          ? ((logoColors as any).primaryColor || 'var(--hds-sys-color-theme-surface)')
                          : 'transparent'
                      }}
                    >
                      <PixelText2D
                        text={lang.label}
                        textEnabled
                        pixelSize={1}
                        letterSpacing={0}
                        width={40}
                        height={24}
                        animated={false}
                        primaryColor={
                          i18n.language === lang.code 
                            ? ((logoColors as any).secondaryColor || 'var(--hds-sys-color-on-theme-surface)')
                            : ((logoColors as any).primaryColor || 'var(--hds-sys-color-theme-surface)')
                        }
                        onPrimaryColor={(logoColors as any).secondaryColor}
                      />
                    </div>
                  ))}
                </div>
              )}
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
              ? rawBlocks.map((b, blockIndex) => {
                  // 📹 調試：記錄每個內容區塊的類型
                  console.log(`[Home] 項目 ${item.id} 區塊 ${blockIndex}:`, {
                    type: b.type,
                    hasVideoSrc: b.type === 'video' && !!(b as any).src,
                    hasImageSrc: b.type === 'image' && !!(b as any).src,
                    blockData: b
                  });
                  
                  if (b.type === 'image') {
                    return { ...b, src: resolveSrc(b.src) };
                  }
                  if (b.type === 'video') {
                    const resolvedVideo = { 
                      ...b, 
                      src: resolveSrc(b.src),
                      poster: b.poster ? resolveSrc(b.poster) : undefined
                    };
                    console.log(`[Home] Video 區塊解析結果:`, resolvedVideo);
                    return resolvedVideo;
                  }
                  return b;
                })
              : undefined;
            
            // 當 hover 或打開時顯示 brand，否則顯示 id
            const displayId = ((hoveredCardId === item.id || openCardId === item.id) && item.brand) ? item.brand : item.id;
            
            // 🚀 關鍵優化：使用預載狀態決定初始階段
            const initialPhase = (() => {
              // 如果這張卡片正在被打開，跳過 loading 動畫
              // 因為我們有轉場動畫來處理視覺過渡
              if (openCardId === item.id) {
                const hasLoaded = loadedCardIdsRef.current.has(item.id);
                if (hasLoaded) {
                  log(`卡片 ${item.id} 已完全載入，直接顯示 ready`);
                  return 'ready';
                } else {
                  // 即使未預載，也跳過 loading 動畫，直接進入 positioning
                  // 因為轉場動畫已經提供了視覺回饋
                  log(`卡片 ${item.id} 正在打開，跳過 loading 動畫`);
                  return 'positioning';
                }
              }
              
              // 對於其他卡片，維持原有邏輯
              const hasLoaded = loadedCardIdsRef.current.has(item.id);
              const hasPreloaded = isPreloaded(item.id);
              
              if (hasLoaded) {
                return 'ready';
              } else if (hasPreloaded) {
                return 'expanding';
              } else {
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
                onClick={(e) => {
                  // 當有其他卡片開啟時，禁止點擊
                  if (openCardId && openCardId !== item.id) {
                    e.stopPropagation();
                    return;
                  }
                  handleOpenCard(item.id, e);
                }}
                onMouseEnter={() => handleCardHover(item.id)}
                onMouseLeave={handleCardLeave}
                style={{ 
                  cursor: openCardId === item.id ? 'auto' : (openCardId ? 'default' : 'pointer'),
                  pointerEvents: openCardId && openCardId !== item.id ? 'none' : 'auto',
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
                    infoMaxWidth={1400}
                    infoData={{ id: displayId, heading: item.heading, date: item.date, tags: item.tags, category: item.category }}
                    primaryColor={item.primaryColor}
                    contentBlocks={resolvedBlocks}
                    projectInfo={item.projectInfo}
                    use2D={size === 'xs'}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 8-bit 風格的轉場動畫 */}
      <TransitionOverlay
        isActive={isTransitioning}
        clickPosition={transitionClickPosition || undefined}
        color={transitionColor}
        shouldStartDisappear={shouldStartDisappear}
        onFilled={() => {
          console.log('[Home] 轉場動畫已填滿畫面');
        }}
        onComplete={() => {
          console.log('[Home] 轉場動畫完成');
          setIsTransitioning(false);
          setShouldStartDisappear(false);
        }}
      />
    </div>
  );
};

export default Home;


