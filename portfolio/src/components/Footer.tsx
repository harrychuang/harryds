import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import './Footer.scss';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useI18nFeed } from '../hooks/useI18nFeed';
import type { FeedItem } from 'hds/types/feed';
import { PopupModal, Input, Dropdown } from 'hds';
import type { DropdownOption } from 'hds';
import { useHover } from '../contexts/HoverContext';
import { useOverlay } from '../contexts/OverlayContext';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { useTheme } from '../theme/useTheme';
import ScrollIndicator from './ScrollIndicator';
import { GIPHY_URLS } from '../constants/giphy';
import { audioManager, type PlaybackHandle } from '../../../harryds/src/utils/audioManager';
import hoverSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep.mp3';

const THANK_YOU_MESSAGES = [
  'Thanks!',
  'Thank you!',
  'Big thanks!',
  'Mega thx!',
  'You rock!',
  'Much love!',
  'So grateful',
  'Love it!',
  'Cheers!',
  'High five!',
];

const GIF_DISPLAY_DURATION_MS = 5000;
const EXIT_ANIMATION_DURATION_MS = 600;
const HEART_STORAGE_KEY = 'noeinoi-heart-liked';

const normalizePathKey = (raw: string | null | undefined): string => {
  if (!raw) {
    return '/';
  }

  const [pathPart] = raw.split('?');
  let normalized = pathPart || '/';

  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized || '/';
};

const getStoredLikedPaths = (): Set<string> => {
  if (typeof window === 'undefined') {
    return new Set();
  }

  const raw = window.localStorage.getItem(HEART_STORAGE_KEY);
  if (!raw) {
    return new Set();
  }

  if (raw === 'true') {
    return new Set(['/']);
  }

  if (raw === 'false') {
    return new Set();
  }

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return new Set(parsed.map((item) => normalizePathKey(String(item))));
    }

    if (parsed && typeof parsed === 'object') {
      const liked = new Set<string>();
      Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
        if (value === true || value === 'true') {
          liked.add(normalizePathKey(key));
        }
      });
      return liked;
    }
  } catch (error) {
    console.warn('[Footer] Failed to parse heart likes from localStorage', error);
  }

  return new Set();
};

const persistLikedPaths = (paths: Set<string>) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (paths.size === 0) {
    window.localStorage.removeItem(HEART_STORAGE_KEY);
    return;
  }

  const payload = Array.from(paths);
  window.localStorage.setItem(HEART_STORAGE_KEY, JSON.stringify(payload));
};

const Footer: React.FC = () => {
  const params = useParams();
  const { t } = useTranslation('common');
  const { items } = useI18nFeed();
  const { hoveredCardId } = useHover();
  const { openCardId, animationPhase, overlayScrollRef } = useOverlay();
  const { theme } = useTheme();
  const location = useLocation();
  const rightText = "COPYRIGHT © HARRY.DS ALL RIGHTS RESERVED.";
  const [isGifVisible, setIsGifVisible] = useState(false);
  const [isGifExiting, setIsGifExiting] = useState(false);
  const [currentGifUrl, setCurrentGifUrl] = useState<string | null>(null);
  const [thankYouMessage, setThankYouMessage] = useState<string | null>(null);
  const [preloadedGifUrl, setPreloadedGifUrl] = useState<string | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const preloadImageRef = useRef<HTMLImageElement | null>(null);
  const preloadedGifCacheRef = useRef<Set<string>>(new Set());
  const [popupKey, setPopupKey] = useState(0);
  const [isHeartLiked, setIsHeartLiked] = useState(false);
  const hasHydratedPreferenceRef = useRef(false);
  const hydratedPageKeyRef = useRef<string | null>(null);
  const pageStorageKey = useMemo(() => normalizePathKey(location.pathname), [location.pathname]);

  // Contact Modal state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactProjectType, setContactProjectType] = useState('');
  const [contactBudget, setContactBudget] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  // Contact Modal options
  const projectTypeOptions: DropdownOption[] = useMemo(() => [
    { value: 'brand', label: t('contactModal.projectTypes.brand') },
    { value: 'web', label: t('contactModal.projectTypes.web') },
    { value: 'uiux', label: t('contactModal.projectTypes.uiux') },
    { value: 'dev', label: t('contactModal.projectTypes.dev') },
    { value: 'other', label: t('contactModal.projectTypes.other') },
  ], [t]);

  const budgetOptions: DropdownOption[] = useMemo(() => [
    { value: 'unsure', label: t('contactModal.budgets.unsure') },
    { value: 'under20k', label: t('contactModal.budgets.under20k') },
    { value: '20k-100k', label: t('contactModal.budgets.20k-100k') },
    { value: '100k-200k', label: t('contactModal.budgets.100k-200k') },
    { value: '200k+', label: t('contactModal.budgets.200k+') },
  ], [t]);

  const consultingBudgetOptions: DropdownOption[] = useMemo(() => [
    { value: 'under5k', label: t('contactModal.consultingBudgets.under5k') },
    { value: '5k-10k', label: t('contactModal.consultingBudgets.5k-10k') },
    { value: '10k+', label: t('contactModal.consultingBudgets.10k+') },
    { value: 'unsure', label: t('contactModal.consultingBudgets.unsure') },
  ], [t]);

  const budgetDropdownOptions = useMemo(() => (
    contactProjectType === 'brand' ? consultingBudgetOptions : budgetOptions
  ), [contactProjectType, consultingBudgetOptions, budgetOptions]);
  
  // Hover 音效
  const hoverSoundHandleRef = useRef<PlaybackHandle | null>(null);
  
  // 預載 hover 音效
  useEffect(() => {
    audioManager.preload(hoverSoundUrl).catch(() => {});
  }, []);
  
  // 播放 hover 音效
  const playHoverSound = useCallback(async () => {
    try {
      hoverSoundHandleRef.current?.stop();
      hoverSoundHandleRef.current = await audioManager.play(hoverSoundUrl, { volume: 0.4 });
    } catch (err) {
      console.warn('Footer hover sound play failed:', err);
    }
  }, []);

  // Email 按鈕點擊處理 - 打開 Contact Modal
  const handleEmailClick = useCallback(() => {
    setIsContactModalOpen(true);
  }, []);

  // Contact Modal 關閉處理
  const handleContactModalClose = useCallback(() => {
    setIsContactModalOpen(false);
  }, []);

  // Contact Modal 提交處理
  const handleContactSubmit = useCallback(() => {
    console.log({
      name: contactName,
      email: contactEmail,
      projectType: contactProjectType,
      budget: contactBudget,
      message: contactMessage,
    });
    alert(t('contactModal.success'));
    setIsContactModalOpen(false);
    // Reset form
    setContactName('');
    setContactEmail('');
    setContactProjectType('');
    setContactBudget('');
    setContactMessage('');
  }, [contactName, contactEmail, contactProjectType, contactBudget, contactMessage, t]);

  const pickRandomGifUrl = useCallback((excludeUrl?: string) => {
    if (GIPHY_URLS.length === 0) {
      return null;
    }

    const filtered = excludeUrl ? GIPHY_URLS.filter((url) => url !== excludeUrl) : GIPHY_URLS;
    const pool = filtered.length > 0 ? filtered : GIPHY_URLS;
    const index = Math.floor(Math.random() * pool.length);

    return pool[index] ?? null;
  }, []);

  const preloadRandomGif = useCallback(
    (excludeUrl?: string) => {
      if (typeof window === 'undefined') {
        return;
      }

      const selected = pickRandomGifUrl(excludeUrl);

      if (!selected) {
        setPreloadedGifUrl(null);
        return;
      }

      const cache = preloadedGifCacheRef.current;

      if (cache.has(selected)) {
        setPreloadedGifUrl(selected);
        return;
      }

      const image = new Image();
      preloadImageRef.current = image;

      image.onload = () => {
        if (preloadImageRef.current === image) {
          cache.add(selected);
          setPreloadedGifUrl(selected);
        }
      };

      image.onerror = () => {
        if (preloadImageRef.current === image) {
          cache.delete(selected);
          setPreloadedGifUrl(selected);
        }
      };

      image.src = selected;
    },
    [pickRandomGifUrl]
  );

  // 決定要監聽的滾動容器：當 overlay 處於 expanding 或 ready 階段時，監聽 overlay 的滾動
  const shouldMonitorOverlay = openCardId && (animationPhase === 'expanding' || animationPhase === 'ready');
  
  // 自動查找 overlay 的滾動容器
  useEffect(() => {
    if (shouldMonitorOverlay) {
      const findOverlayScrollContainer = () => {
        const overlayContent = document.querySelector('.feed-detail-overlay__content') as HTMLDivElement;
        if (overlayContent && overlayScrollRef.current !== overlayContent) {
          overlayScrollRef.current = overlayContent;
        }
      };
      
      // 嘗試立即查找
      findOverlayScrollContainer();
      
      // 如果沒找到，設置一個短暫的輪詢（處理動畫延遲）
      const pollInterval = setInterval(() => {
        if (overlayScrollRef.current) {
          clearInterval(pollInterval);
          return;
        }
        findOverlayScrollContainer();
      }, 50);
      
      // 清理輪詢
      setTimeout(() => clearInterval(pollInterval), 1000);
      
      return () => clearInterval(pollInterval);
    } else {
      // 當不需要監聽 overlay 時，清除 ref
      overlayScrollRef.current = null;
    }
  }, [shouldMonitorOverlay, overlayScrollRef]);
  
  const scrollContainer = shouldMonitorOverlay ? overlayScrollRef.current : null;
  
  const scrollProgress = useScrollProgress({ scrollContainer });

  useEffect(() => {
    if (preloadImageRef.current) {
      preloadImageRef.current.onload = null;
      preloadImageRef.current.onerror = null;
      preloadImageRef.current = null;
    }

    setPreloadedGifUrl(null);
    preloadRandomGif();
  }, [pageStorageKey, preloadRandomGif]);

  const handleHeartClick = useCallback(() => {
    if (isHeartLiked) {
      setIsHeartLiked(false);

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }

      setIsGifVisible(false);
      setIsGifExiting(false);
      setCurrentGifUrl(null);
      setThankYouMessage(null);
      return;
    }

    const gifToDisplay = preloadedGifUrl ?? pickRandomGifUrl();

    if (!gifToDisplay) {
      return;
    }

    setIsHeartLiked(true);

    const messageIndex = Math.floor(Math.random() * THANK_YOU_MESSAGES.length);
    const selectedMessage = THANK_YOU_MESSAGES[messageIndex];

    setCurrentGifUrl(gifToDisplay);
    setThankYouMessage(selectedMessage);
    setIsGifExiting(false);
    setIsGifVisible(true);
    setPopupKey((prev) => prev + 1);

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    hideTimerRef.current = setTimeout(() => {
      setIsGifExiting(true);
      exitTimerRef.current = setTimeout(() => {
        setIsGifVisible(false);
        setIsGifExiting(false);
        setCurrentGifUrl(null);
        setThankYouMessage(null);
        exitTimerRef.current = null;
      }, EXIT_ANIMATION_DURATION_MS);
    }, GIF_DISPLAY_DURATION_MS);
    if (preloadedGifUrl) {
      setPreloadedGifUrl(null);
    }
    preloadRandomGif(gifToDisplay);
  }, [isHeartLiked, pickRandomGifUrl, preloadedGifUrl, preloadRandomGif]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    hasHydratedPreferenceRef.current = false;
    const likedPaths = getStoredLikedPaths();
    const storedLiked = likedPaths.has(pageStorageKey);
    setIsHeartLiked(storedLiked);
    hydratedPageKeyRef.current = pageStorageKey;
    hasHydratedPreferenceRef.current = true;
  }, [pageStorageKey]);

  useEffect(() => {
    if (
      !hasHydratedPreferenceRef.current ||
      typeof window === 'undefined' ||
      hydratedPageKeyRef.current !== pageStorageKey
    ) {
      return;
    }

    const likedPaths = getStoredLikedPaths();
    if (isHeartLiked) {
      likedPaths.add(pageStorageKey);
    } else {
      likedPaths.delete(pageStorageKey);
    }

    persistLikedPaths(likedPaths);
  }, [isHeartLiked, pageStorageKey]);

  useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    setIsGifVisible(false);
    setIsGifExiting(false);
    setCurrentGifUrl(null);
    setThankYouMessage(null);
  }, [pageStorageKey]);

  useEffect(() => () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
    }
    if (preloadImageRef.current) {
      preloadImageRef.current.onload = null;
      preloadImageRef.current.onerror = null;
      preloadImageRef.current = null;
    }
  }, []);

  // 獲取當前活動卡片的顏色（與 Home 組件相同的邏輯）
  const footerColors = useMemo(() => {
    // 如果在 /articles, /article/*, 或 /about 路由，不使用顏色
    const currentPath = location.pathname;
    if (currentPath === '/articles' || currentPath.startsWith('/article') || currentPath === '/about') {
      return {};
    }
    
    // 首先檢查 URL 中的打開卡片（只在 Home 頁面的 project 路由中）
    let urlOpenCardId: number | null = null;
    const idParam = params.id;
    
    // 只在 /project/:id/:slug 路由時才獲取顏色
    // 透過檢查路徑是否以 /project 開頭
    if (idParam && currentPath.startsWith('/project')) {
      const id = Number(idParam);
      if (!isNaN(id)) {
        urlOpenCardId = id;
      }
    }
    
    // 使用打開的卡片或懸停的卡片（與 logo 相同的邏輯）
    // 優先使用 Context 中的 openCardId，如果沒有則使用 URL 中的
    const activeCardId = openCardId || urlOpenCardId || hoveredCardId;
    
    if (activeCardId) {
      const activeItem = items.find((item: FeedItem) => item.id === activeCardId);
      if (activeItem && activeItem.primaryColor && activeItem.secondaryColor) {
        return {
          primaryColor: activeItem.primaryColor,
          secondaryColor: activeItem.secondaryColor,
        };
      }
    }
    
    return {};
  }, [params.id, params.category, hoveredCardId, openCardId, items, location.pathname]);

  // 決定 ScrollIndicator 和 Copyright 的顏色：有 primaryColor 時使用，沒有時使用 CSS 變數
  const displayColor = footerColors.primaryColor || 'var(--hds-sys-color-theme-surface)';
  const displaySecondaryColor = footerColors.secondaryColor || 'var(--on-hds-sys-color-theme-surface)';

  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__left">
          <span
            className="footer__copyright"
            style={{ color: displayColor }}
          >
            {rightText}
          </span>
        </div>
        <div className="footer__right">
          {isGifVisible && currentGifUrl && (
            <div
              key={popupKey}
              className={`footer__giphy-popup ${isGifExiting ? 'footer__giphy-popup--exit' : ''}`}
            >
              <div className="footer__giphy-inner">
                <div
                  className="footer__giphy-image"
                  style={{ backgroundImage: `url(${currentGifUrl})` }}
                  role="img"
                  aria-label="讚賞動畫"
                >
                  {thankYouMessage && (
                    <div className="footer__giphy-overlay">
                      <span className="footer__giphy-message">{thankYouMessage}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <ScrollIndicator 
            scrollProgress={scrollProgress}
            primaryColor={displayColor}
            secondaryColor={displaySecondaryColor}
            scrollContainer={scrollContainer}
            openCardId={openCardId}
            enableScrollToTop={false}
            icon="✉"
            iconAriaLabel="寄信給我"
            iconClassName="scroll-indicator__icon--email"
            bounceDelayMs={200}
            sliderMultiplier={0.5}
            onIconClick={handleEmailClick}
            onIconHover={playHoverSound}
          />
          <ScrollIndicator 
            scrollProgress={scrollProgress}
            primaryColor={displayColor}
            secondaryColor={displaySecondaryColor}
            scrollContainer={scrollContainer}
            openCardId={openCardId}
            enableScrollToTop={false}
            icon="♥"
            iconAriaLabel="收藏"
            iconClassName="scroll-indicator__icon--heart"
            bounceDelayMs={100}
            sliderMultiplier={1}
            onIconClick={handleHeartClick}
            onIconHover={playHoverSound}
            disableProgress={isHeartLiked}
            isLiked={isHeartLiked}
          />
          <ScrollIndicator 
            scrollProgress={scrollProgress}
            primaryColor={displayColor}
            secondaryColor={displaySecondaryColor}
            scrollContainer={scrollContainer}
            openCardId={openCardId}
            bounceDelayMs={0}
            sliderMultiplier={2}
            onIconHover={playHoverSound}
          />
        </div>
      </div>

      {/* Contact Modal */}
      <PopupModal
        isOpen={isContactModalOpen}
        onClose={handleContactModalClose}
        heading={t('contactModal.heading')}
        description={t('contactModal.description')}
        primaryButtonText={t('contactModal.send')}
        secondaryButtonText={t('contactModal.cancel')}
        onPrimaryClick={handleContactSubmit}
      >
        <Input
          label={t('contactModal.name')}
          placeholder={t('contactModal.namePlaceholder')}
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          required
        />
        <Input
          label={t('contactModal.email')}
          placeholder={t('contactModal.emailPlaceholder')}
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          required
        />
        <Dropdown
          label={t('contactModal.projectType')}
          options={projectTypeOptions}
          value={contactProjectType}
          onChange={(val) => {
            setContactProjectType(val);
            setContactBudget('');
          }}
          placeholder={t('contactModal.projectTypePlaceholder')}
        />
        <Dropdown
          key={`footer-budget-${contactProjectType || 'default'}`}
          label={t('contactModal.budget')}
          options={budgetDropdownOptions}
          value={contactBudget}
          onChange={(val) => setContactBudget(val)}
          placeholder={t('contactModal.budgetPlaceholder')}
        />
        <Input
          label={t('contactModal.message')}
          placeholder={t('contactModal.messagePlaceholder')}
          value={contactMessage}
          onChange={(e) => setContactMessage(e.target.value)}
        />
      </PopupModal>
    </footer>
  );
};

export default Footer;
