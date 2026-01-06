import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import './Home.scss';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo, FeedDetailOverlay, PopupModal, PocketConsole } from 'hds';
import type { FeedCardSize } from 'hds';
import type { FeedItem, FeedContentBlock } from '../../../harryds/src/types/feed';
import { useProjects } from '../hooks/useProjects';
import { useDataSource } from '../contexts/DataSourceContext';
import hoverSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep.mp3';
import clickSoundUrl from '../../assets/sound/8-Bit Sound Effect 28-1.mp3';
import { audioManager, type PlaybackHandle } from '../../../harryds/src/utils/audioManager';
import { useSmartPreload } from '../hooks/useSmartPreload';
import { useTheme } from '../theme/useTheme';
import { useHover } from '../contexts/HoverContext';
import { useSound } from '../hooks/useSound';
import { useOverlay } from '../contexts/OverlayContext';
import Header from '../components/Header';
import SEO, { useSEOPresets } from '../components/SEO';
import { usePageLoader } from '../contexts/PageLoaderContext';
import { useContactModal } from '../contexts/ContactModalContext';
import { useHoverCapability } from '../hooks/useHoverCapability';
import { trackProjectView, trackPrivateProjectUnlock, trackLanguageChange, trackThemeChange, trackSoundToggle, trackContactOpen } from '../utils/analytics';

const slugify = (text: string) => text
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-');

const PAGE_NAME = 'home';

// PocketConsole 螢幕內容組件（每 3 秒切換）
const PocketConsoleScreenContent: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowPassword(prev => !prev);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const baseStyle: React.CSSProperties = {
    color: '#0f380f',
    fontFamily: 'PublicPixel, monospace',
    textAlign: 'center',
    fontSize: '15px',
    lineHeight: 1.6,
  };

  if (showPassword) {
    return (
      <div style={{ ...baseStyle, fontSize: '12px', lineHeight: 1.8 }}>
        <div>PLEASE</div>
        <div>ENTER THE</div>
        <div>PASSWORD.</div>
      </div>
    );
  }

  return (
    <div style={baseStyle}>
      <div>HARRY</div>
      <div>DESIGN</div>
      <div>STUDIO</div>
    </div>
  );
};

const Home: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['common', 'projects']);
  // 使用統一的資料介面，根據設定自動選擇資料來源
  const { items, loading, error, dataSource } = useProjects();
  const { toggleDataSource } = useDataSource();
  const { setLoading, isPageLoaded, markPageAsLoaded, setAnimationComplete } = usePageLoader();
  
  // 同步 loading 狀態到全域 PageLoader
  // 如果頁面已載入過，跳過 loading
  useEffect(() => {
    if (isPageLoaded(PAGE_NAME)) {
      // 頁面已載入過，直接跳過 loading
      setLoading(false);
      setAnimationComplete(true);
    } else {
      // 首次載入，顯示 loading
      setLoading(loading);
      // 載入完成後標記頁面為已載入
      if (!loading) {
        markPageAsLoaded(PAGE_NAME);
      }
    }
  }, [loading, setLoading, isPageLoaded, markPageAsLoaded, setAnimationComplete]);
  
  const log = useCallback((..._args: any[]) => {}, []);
  const { theme, toggleTheme } = useTheme();
  const { hoveredCardId, setHoveredCardId } = useHover();
  const { isSoundEnabled, toggleSound } = useSound();
  
  // 檢測設備是否支援 hover（觸控設備上禁用 hover 效果）
  const hasHover = useHoverCapability();
  const { 
    setOpenCardId: setContextOpenCardId, 
    setAnimationPhase: setContextAnimationPhase, 
    overlayScrollRef,
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
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Contact Modal - 使用共用的 Context
  const { openContactModal } = useContactModal();
  
  // SEO Presets (i18n)
  const seoPresets = useSEOPresets();
  
  // In Development Modal state
  const [isInDevModalOpen, setIsInDevModalOpen] = useState(false);
  
  // Archived Modal state
  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);
  
  // Private Project Unlock Modal state
  const [privateUnlockModalOpen, setPrivateUnlockModalOpen] = useState(false);
  const [pendingPrivateCardId, setPendingPrivateCardId] = useState<number | null>(null);
  const unlockedPrivateIdsRef = useRef<Set<number>>(new Set());

  // 追蹤視窗寬度，用於響應式尺寸調整
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1400);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


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
        // 更新 .home 元素背景色
        homeRef.current.style.backgroundColor = activeItem.secondaryColor;
        homeRef.current.style.transition = 'background-color 0.3s ease';
        
        // 同時更新 html 和 body 背景色
        document.documentElement.style.backgroundColor = activeItem.secondaryColor;
        document.documentElement.style.transition = 'background-color 0.3s ease';
        document.body.style.backgroundColor = activeItem.secondaryColor;
        document.body.style.transition = 'background-color 0.3s ease';
      }
    } else {
      // 恢復原始背景色
      homeRef.current.style.backgroundColor = '';
      homeRef.current.style.transition = 'background-color 0.3s ease';
      
      // 清除 html 和 body 的背景色
      document.documentElement.style.backgroundColor = '';
      document.documentElement.style.transition = 'background-color 0.3s ease';
      document.body.style.backgroundColor = '';
      document.body.style.transition = 'background-color 0.3s ease';
    }
    
    // 清理函數：組件卸載時恢復原始背景色
    return () => {
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    };
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
    'en': 'EN',
    'ja': 'JP'
  }), []);

  const currentLangDisplay = useMemo(() => {
    return languageMap[i18n.language as keyof typeof languageMap] || 'EN';
  }, [i18n.language, languageMap]);

  const handleLanguageChange = useCallback((lang: string) => {
    const fromLang = i18n.language;
    i18n.changeLanguage(lang);
    setIsLangDropdownOpen(false);
    playMenuClickSound();
    // GA 追蹤：語言切換
    trackLanguageChange(fromLang, lang);
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
    // 使用原始英文 heading 生成 slug，確保所有語系的 URL 一致
    const headingForSlug = item.originalHeading || item.heading;
    const slug = slugify(headingForSlug);
    // Home 頁面只顯示 projects，所以固定使用 /project/ 路徑
    return `/project/${item.id}/${slug}`;
  }, []);

  const handleOpenCard = useCallback((cardId: number, event?: React.MouseEvent) => {
    // 如果已經有卡片開啟，直接返回（避免重複觸發）
    if (openCardId !== null) {
      return;
    }
    
    const item = items.find(i => i.id === cardId);
    if (!item) return;
    
    // 檢查是否為 private 專案且尚未解鎖
    if (item.isPrivate && !unlockedPrivateIdsRef.current.has(cardId)) {
      // 顯示解鎖 modal
      setPendingPrivateCardId(cardId);
      setPrivateUnlockModalOpen(true);
      return;
    }
    
    // GA 追蹤：專案瀏覽
    trackProjectView(cardId, item.heading, item.category);
    
    // 檢查是否已經載入過
    const hasLoaded = loadedCardIdsRef.current.has(cardId);
    
    if (hasLoaded) {
      // 已載入過，直接導航，不顯示 loading
      navigate(toItemUrl(item), { replace: false });
    } else {
      // 首次載入，觸發 PageLoader 動畫
      setLoading(true);
      
      // 延遲一小段時間再導航，確保 loading 動畫已經開始
      setTimeout(() => {
        navigate(toItemUrl(item), { replace: false });
      }, 100);
    }
  }, [openCardId, items, navigate, toItemUrl, setLoading]);
  
  // Private Project Unlock 成功處理
  const handlePrivateUnlockSuccess = useCallback(() => {
    if (pendingPrivateCardId !== null) {
      // 標記為已解鎖
      unlockedPrivateIdsRef.current.add(pendingPrivateCardId);
      
      // 關閉 modal
      setPrivateUnlockModalOpen(false);
      
      const item = items.find(i => i.id === pendingPrivateCardId);
      
      // GA 追蹤：私人專案解鎖
      if (item) {
        trackPrivateProjectUnlock(pendingPrivateCardId, item.heading);
        trackProjectView(pendingPrivateCardId, item.heading, item.category);
      }
      if (item) {
        const currentUrl = toItemUrl(item);
        const isAlreadyOnProjectUrl = params.id === String(pendingPrivateCardId);
        
        if (isAlreadyOnProjectUrl) {
          // 如果已經在正確的 URL 上（從 URL 直接進入的情況），直接設置 openCardId
          setOpenCardId(item.id);
          setContextOpenCardId(item.id);
          setLoading(false);
        } else {
          // 從首頁點擊進入的情況，需要導航
          const hasLoaded = loadedCardIdsRef.current.has(pendingPrivateCardId);
          if (hasLoaded) {
            navigate(currentUrl, { replace: false });
          } else {
            setLoading(true);
            setTimeout(() => {
              navigate(currentUrl, { replace: false });
            }, 100);
          }
        }
      }
      
      setPendingPrivateCardId(null);
    }
  }, [pendingPrivateCardId, items, navigate, toItemUrl, setLoading, params.id, setContextOpenCardId]);
  
  // Private Project Unlock Modal 關閉處理
  const handlePrivateUnlockClose = useCallback(() => {
    setPrivateUnlockModalOpen(false);
    setPendingPrivateCardId(null);
    
    // 如果當前 URL 是 private 專案的 URL，導航回首頁
    if (params.id) {
      navigate('/', { replace: true });
    }
  }, [params.id, navigate]);

  const handleCloseCard = useCallback(() => {
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
    
    navigate('/', { replace: false });
  }, [navigate, setContextOpenCardId, setContextAnimationPhase]);

  // Contact Modal handler - 使用共用的 Context
  const handleEmailClick = useCallback((_email: string) => {
    openContactModal();
  }, [openContactModal]);

  // In Development Modal handlers
  const handleInDevClick = useCallback(() => {
    setIsInDevModalOpen(true);
  }, []);

  const handleInDevModalClose = useCallback(() => {
    setIsInDevModalOpen(false);
  }, []);

  // Archived Modal handlers
  const handleArchivedClick = useCallback(() => {
    setIsArchivedModalOpen(true);
  }, []);

  const handleArchivedModalClose = useCallback(() => {
    setIsArchivedModalOpen(false);
  }, []);

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
    setOpenCardAnimationPhase(phase);
    setContextAnimationPhase(phase); // 同步更新 Context
    // 當動畫到達 ready 階段時，記錄該卡片已載入過，並關閉 PageLoader
    if (phase === 'ready' && openCardId != null) {
      loadedCardIdsRef.current.add(openCardId);
      // 關閉 PageLoader
      setLoading(false);
    }
  }, [openCardId, setContextAnimationPhase, setLoading]);

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

  // 觸控設備的 touch 事件處理（模擬 hover 效果）
  const handleCardTouchStart = useCallback((cardId: number) => {
    if (openCardId) return;
    
    // 開始智能預載
    onHoverStart(cardId);
    log(`[Touch] 開始預載卡片 ${cardId}`);
    
    // 觸發 hover 效果
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

  const handleCardTouchEnd = useCallback(() => {
    // 取消預載
    if (hoveredCardId) {
      onHoverEnd(hoveredCardId);
      log(`[Touch] 取消預載卡片 ${hoveredCardId}`);
    }
    
    // 清除 hover 效果
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

  // 動態計算 Grid 佈局結構
  const getGridLayout = useCallback((totalItems: number) => {
    const rows: { startIndex: number; count: number; columns: 2 | 3 }[] = [];
    
    // Row 1: hero (1 column)
    if (totalItems >= 1) {
      rows.push({ startIndex: 0, count: 1, columns: 1 as any });
    }
    
    // Row 2: med (2 columns)
    if (totalItems >= 2) {
      const medCount = Math.min(2, totalItems - 1);
      rows.push({ startIndex: 1, count: medCount, columns: 2 });
    }
    
    // Row 3: med (2 columns)
    if (totalItems >= 4) {
      const medCount = Math.min(2, totalItems - 3);
      rows.push({ startIndex: 3, count: medCount, columns: 2 });
    }
    
    // Row 4+: 動態計算 xs (避免最後一個 row 只有 1 個)
    if (totalItems > 5) {
      const remaining = totalItems - 5; // 前 5 個已分配：1 hero + 2 med + 2 med
      let currentIndex = 5;
      let remainingItems = remaining;
      
      // 判斷是否需要特殊處理最後一個 row（避免單獨 1 個）
      const needsSpecialHandling = remaining % 3 === 1;
      
      if (needsSpecialHandling) {
        // 情況：4, 7, 10, 13... (除以 3 餘 1)
        // 策略：前面的用 3 columns，最後 4 個用 2×2
        const normalRowCount = Math.floor((remaining - 4) / 3);
        for (let i = 0; i < normalRowCount; i++) {
          rows.push({ startIndex: currentIndex, count: 3, columns: 3 });
          currentIndex += 3;
          remainingItems -= 3;
        }
        
        // 最後 4 個用 2×2
        rows.push({ startIndex: currentIndex, count: 2, columns: 2 });
        rows.push({ startIndex: currentIndex + 2, count: 2, columns: 2 });
      } else {
        // 正常佈局：盡量用 3 columns
        while (remainingItems > 0) {
          const count = Math.min(3, remainingItems);
          // 如果是最後一個 row 且只有 2 個，也用 2 columns
          const columns = count === 2 ? 2 : 3;
          rows.push({ startIndex: currentIndex, count, columns });
          currentIndex += count;
          remainingItems -= count;
        }
      }
    }
    
    return rows;
  }, []);

  const getSizeByIndex = useCallback((index: number): FeedCardSize => {
    if (index === 0) {
      // 當視窗寬度 <= 767px 時，hero 改為 sm
      if (windowWidth <= 767) return 'sm';
      // 當視窗寬度小於 1200px 時，hero 改為 med
      if (windowWidth < 1200) return 'med';
      return 'hero';
    }
    if (index >= 1 && index <= 4) {
      // 當視窗寬度小於 1100px 時，sm 改為 xs
      if (windowWidth < 1100) return 'xs';
      // 當視窗寬度小於 1400px 時，med 改為 sm
      if (windowWidth < 1400) return 'sm';
      return 'med';
    }
    return 'xs';
  }, [windowWidth]);

  const getRowInfoByIndex = useCallback((index: number, totalItems: number) => {
    const rows = getGridLayout(totalItems);
    for (const row of rows) {
      if (index >= row.startIndex && index < row.startIndex + row.count) {
        return {
          rowIndex: rows.indexOf(row),
          columns: row.columns,
          isFirstInRow: index === row.startIndex,
          isLastInRow: index === row.startIndex + row.count - 1,
        };
      }
    }
    return { rowIndex: -1, columns: 3 as const, isFirstInRow: false, isLastInRow: false };
  }, [getGridLayout]);

  // 由於現在完全使用 Strapi 資料，不再需要本地圖片處理
  
  // Header 組件所需的派生屬性
  const shouldHideNav = !!(openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready'));
  const headerLogoType: 'default' | 'back' = shouldHideNav ? 'back' : 'default';
  const headerLogoAnimated = shouldHideNav ? isLogoHovered : true;
  const headerLogoWrapperStyle: React.CSSProperties = {
    cursor: shouldHideNav ? 'pointer' : 'auto',
    transform: (() => {
      const translateX = shouldHideNav ? 'translateX(-10px)' : 'translateX(0px)';
      let scale = '';
      if (windowWidth < 480) {
        scale = 'scale(0.55)';
      } else if (windowWidth < 540) {
        scale = 'scale(0.65)';
      } else if (windowWidth < 640) {
        scale = 'scale(0.8)';
      }
      return scale ? `${translateX} ${scale}` : translateX;
    })(),
    transformOrigin: 'left center',
    // 補償 scale 造成的佔位空間問題（負 margin 讓 menu 不會被推太遠）
    marginRight: windowWidth < 540 ? '-35%' : windowWidth <= 640 ? '-20%' : 0
  };
  const navColors = {
    primaryColor: (logoColors as any).primaryColor,
    secondaryColor: (logoColors as any).secondaryColor
  };
  const languageOptions = React.useMemo(() => ([
    { code: 'en', label: 'EN' },
    { code: 'zh-Hant', label: 'ZH' },
    { code: 'ja', label: 'JP' }
  ].filter((lang) => {
    const currentLang = i18n.language.startsWith('zh') ? 'zh-Hant' : i18n.language;
    return lang.code !== currentLang;
  })), [i18n.language]);
  // strapiClient.ts 中的 resolveMediaUrl 已經處理了所有圖片 URL
  const resolveSrc = (url?: string) => {
    // 直接返回 strapiClient 處理過的 URL，不做任何額外處理
    return url || '';
  };

  useEffect(() => {
    // 將 URL 狀態反映到 openCardId
    // Home 頁面路由：/ 或 /project/:id/:slug
    const idParam = params.id;
    if (!idParam) {
      setOpenCardId(null);
      setContextOpenCardId(null); // 同步更新 Context
      // 清除 hover 狀態，避免瀏覽器返回時殘留 hover 效果
      setHoveredCardId(null);
      setOpenCardAnimationPhase('closed');
      setContextAnimationPhase('closed');
      return;
    }
    const id = Number(idParam);
    if (!id || Number.isNaN(id)) {
      setOpenCardId(null);
      setContextOpenCardId(null); // 同步更新 Context
      return;
    }
    // Home 只顯示 projects，所以直接根據 id 查找
    const item = items.find(i => i.id === id);
    if (item) {
      // 檢查是否為 private 專案且尚未解鎖
      if (item.isPrivate && !unlockedPrivateIdsRef.current.has(id)) {
        // 顯示解鎖 modal，不設置 openCardId（避免顯示內容）
        setPendingPrivateCardId(id);
        setPrivateUnlockModalOpen(true);
        setOpenCardId(null);
        setContextOpenCardId(null);
      } else {
        setOpenCardId(item.id);
        setContextOpenCardId(item.id); // 同步更新 Context
      }
    } else {
      setOpenCardId(null);
      setContextOpenCardId(null); // 同步更新 Context
    }
  }, [params.id, items, setContextOpenCardId]);

  // 預渲染就緒事件 - 當專案頁面資料載入完成後觸發
  // 這讓 @prerenderer/rollup-plugin 知道何時可以擷取 HTML
  useEffect(() => {
    // 只在專案詳情頁面觸發（有 params.id）
    if (params.id && !loading) {
      const id = Number(params.id);
      const item = items.find(i => i.id === id);
      
      // 確保專案資料已載入且不是 private 專案
      if (item && !item.isPrivate) {
        // 延遲一小段時間確保 react-helmet-async 已更新 meta tags
        const timer = setTimeout(() => {
          document.dispatchEvent(new Event('prerender-ready'));
        }, 500);
        return () => clearTimeout(timer);
      }
    }
    // 首頁（無 params.id）的 prerender-ready 由 App.tsx 處理
  }, [params.id, items, loading]);

  // 調試面板已移除

  return (
    <div 
      ref={homeRef} 
      className="home" 
      data-page="home"
      data-detail-open={openCardId !== null ? 'true' : undefined}
    >
      {/* SEO Meta Tags - 動態根據開啟的專案更新 */}
      {openCardId && items.find(i => i.id === openCardId) ? (() => {
        const openedItem = items.find(i => i.id === openCardId)!;
        const headingForSlug = openedItem.originalHeading || openedItem.heading;
        const projectSlug = slugify(headingForSlug);
        return (
          <SEO
            title={openedItem.heading}
            description={openedItem.projectInfo?.description || openedItem.subtitle}
            image={openedItem.heroImage}
            path={`project/${openedItem.id}/${projectSlug}`}
            type="website"
            keywords={openedItem.tags}
          />
        );
      })() : (
        <SEO {...seoPresets.home} />
      )}
      
      {/* 預載統計面板與切換按鈕已移除 */}

      <Header
        onLogoClick={handleLogoClick}
        onLogoMouseEnter={handleLogoHover}
        onLogoMouseLeave={handleLogoLeave}
        logoType={headerLogoType}
        logoAnimated={headerLogoAnimated}
        logoColors={logoColors as any}
        logoWrapperStyle={headerLogoWrapperStyle}
        hideNav={shouldHideNav}
        menuItems={['work', 'articles', 'about']}
        activeMenuItem="work"
        t={t}
        getMenuItemAnimated={(key) => !!menuAnimStates[key]}
        onMenuItemHover={(key) => { triggerMenuHoverOnce(key); playMenuHoverSound(); }}
        onMenuItemClick={(key) => { 
          playMenuClickSound(); 
          if (key === 'about') {
            // 如果頁面已載入過，直接導航；否則先觸發 loading
            if (isPageLoaded('about')) {
              navigate('/about');
            } else {
              setLoading(true);
              setTimeout(() => navigate('/about'), 50);
            }
          } else if (key === 'articles') {
            // 如果頁面已載入過，直接導航；否則先觸發 loading
            if (isPageLoaded('articles')) {
              navigate('/articles');
            } else {
              setLoading(true);
              setTimeout(() => navigate('/articles'), 50);
            }
          }
        }}
        navColors={navColors as any}
        showThemeToggle={true}
        theme={theme}
        onToggleTheme={() => { 
          playMenuClickSound(); 
          toggleTheme(); 
          // GA 追蹤：主題切換
          trackThemeChange(theme === 'light' ? 'dark' : 'light');
        }}
        onThemeHover={() => { playMenuHoverSound(); }}
        showSoundToggle={true}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={() => { 
          playMenuClickSound(); 
          toggleSound(); 
          // GA 追蹤：音效切換
          trackSoundToggle(!isSoundEnabled);
        }}
        onSoundHover={() => { playMenuHoverSound(); }}
        showDataSourceToggle={true}
        dataSource={dataSource}
        onToggleDataSource={() => { playMenuClickSound(); toggleDataSource(); }}
        onDataSourceHover={() => { playMenuHoverSound(); }}
        showLanguageToggle={true}
        currentLangDisplay={currentLangDisplay}
        isLangDropdownOpen={isLangDropdownOpen}
        onToggleLangDropdown={toggleLangDropdown}
        langDropdownRef={langDropdownRef}
        languageOptions={languageOptions}
        onLanguageChange={handleLanguageChange}
        onLanguageHover={() => { playMenuHoverSound(); }}
        onContactClick={() => { 
          playMenuClickSound(); 
          openContactModal(); 
          // GA 追蹤：聯絡 Modal 打開
          trackContactOpen('header');
        }}
      />
      <div className="home__container">
        <div
          className="home__content"
          data-phase={openCardAnimationPhase}
          data-open-id={openCardId ?? undefined}
          data-hover-id={hoveredCardId ?? undefined}
          ref={contentRef}
        >
        {items.map((item, index) => {
          const size = getSizeByIndex(index);
          const rowInfo = getRowInfoByIndex(index, items.length);
          const src = resolveSrc(item.heroImage);
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
            
            // 當 hover 或打開時顯示 brand，否則顯示順序編號（從 1 開始）
            const sequentialId = index + 1;
            const displayId = ((hoveredCardId === item.id || openCardId === item.id) && item.brand) ? item.brand : sequentialId;
            
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
                data-hovered={hoveredCardId === item.id ? 'true' : undefined}
                data-preloaded={isPreloaded(item.id) ? 'true' : undefined}
                data-row={rowInfo.rowIndex}
                data-columns={rowInfo.columns}
                data-first-in-row={rowInfo.isFirstInRow ? 'true' : undefined}
                data-last-in-row={rowInfo.isLastInRow ? 'true' : undefined}
                data-last-alone={
                  // 在 < 1100px 時，如果最後一個卡片單獨在一行，標記為 true
                  // 邏輯：index 0 佔 span 6，其餘佔 span 3，所以剩餘數量若為奇數，最後一個會單獨一行
                  windowWidth < 1100 && index === items.length - 1 && (items.length - 1) % 2 === 1 
                    ? 'true' 
                    : undefined
                }
                onClick={(e) => {
                  // 當有其他卡片開啟時，禁止點擊
                  if (openCardId && openCardId !== item.id) {
                    e.stopPropagation();
                    return;
                  }
                  handleOpenCard(item.id, e);
                }}
                // 桌面設備：使用 mouse 事件
                onMouseEnter={hasHover ? () => handleCardHover(item.id) : undefined}
                onMouseLeave={hasHover ? handleCardLeave : undefined}
                // 觸控設備：使用 touch 事件模擬 hover 效果
                onTouchStart={!hasHover ? () => handleCardTouchStart(item.id) : undefined}
                onTouchEnd={!hasHover ? handleCardTouchEnd : undefined}
                onTouchCancel={!hasHover ? handleCardTouchEnd : undefined}
                style={{ 
                  cursor: openCardId === item.id ? 'auto' : (openCardId ? 'default' : 'pointer'),
                  pointerEvents: openCardId && openCardId !== item.id ? 'none' : 'auto',
                  ['--stagger-index' as any]: index,
                  ['--card-primary-color' as any]: item.primaryColor
                } as React.CSSProperties}
              >
                <FeedDetailOverlay
                    open={openCardId === item.id}
                    onClose={handleCloseCard}
                    onAnimationPhaseChange={openCardId === item.id ? handleAnimationPhaseChange : undefined}
                    src={src}
                    sizeWhenClosed={size}
                    padding={windowWidth <= 767 ? 30 : 40}
                    backgroundProps={{ 
                      pixelSize: size === 'hero' ? 80 : size === 'med' ? 70 : size === 'sm' ? 60 : 50,
                      hoverToOriginal: true,
                      hoverDuration: 500,
                      desaturateUntilHover: true,
                      objectFit: 'cover'
                    }}
                    secondaryColor={item.secondaryColor}
                    infoMaxWidth={1400}
                    infoData={{ id: displayId, heading: item.heading, date: item.date, tags: item.tags.slice(0, 2), category: item.category }}
                    primaryColor={item.primaryColor}
                    contentBlocks={resolvedBlocks}
                    projectInfo={item.projectInfo}
                    onEmailClick={handleEmailClick}
                    onInDevelopmentClick={handleInDevClick}
                    onArchivedClick={handleArchivedClick}
                    isPrivate={item.isPrivate}
                    privateLabel={t('project.private', { ns: 'common' })}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* In Development Modal */}
      <PopupModal
        isOpen={isInDevModalOpen}
        onClose={handleInDevModalClose}
        heading={t('inDevelopmentModal.heading', { ns: 'common' })}
        description={t('inDevelopmentModal.description', { ns: 'common' })}
      />

      {/* Archived Modal */}
      <PopupModal
        isOpen={isArchivedModalOpen}
        onClose={handleArchivedModalClose}
        heading={t('archivedModal.heading', { ns: 'common' })}
        description={t('archivedModal.description', { ns: 'common' })}
      />
      
      {/* Private Project Unlock Modal */}
      {privateUnlockModalOpen && (
        <div className="private-unlock-overlay" onClick={handlePrivateUnlockClose}>
          <div className="private-unlock-modal" onClick={(e) => e.stopPropagation()}>
            <PocketConsole
              width={400}
              animated={true}
              onSuccess={handlePrivateUnlockSuccess}
              onClose={handlePrivateUnlockClose}
              enableKeyboard={true}
              screenContent={<PocketConsoleScreenContent />}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;


