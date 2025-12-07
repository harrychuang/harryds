import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PixelText, Button } from 'hds';
import { audioManager, type PlaybackHandle } from '../../../harryds/src/utils/audioManager';
import { useTheme } from '../theme/useTheme';
import { useSound } from '../hooks/useSound';
import hoverSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep.mp3';
import clickSoundUrl from '../../assets/sound/8-Bit Sound Effect 28-1.mp3';
import SEO from '../components/SEO';
import Header from '../components/Header';
import { usePageLoader } from '../contexts/PageLoaderContext';
import { trackLanguageChange, trackThemeChange, trackSoundToggle, trackContactOpen } from '../utils/analytics';
import { useContactModal } from '../contexts/ContactModalContext';
import './ErrorPage.scss';

// 錯誤類型定義
export type ErrorType = '404' | '500' | 'network' | 'generic';

export interface ErrorPageProps {
  /** 錯誤類型 */
  errorType?: ErrorType;
  /** 自訂錯誤代碼 */
  customCode?: string;
  /** 自訂標題 */
  customTitle?: string;
  /** 自訂描述 */
  customDescription?: string;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  errorType = '404',
  customCode,
  customTitle,
  customDescription,
}) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['common']);
  const { theme, toggleTheme } = useTheme();
  const { isSoundEnabled, toggleSound } = useSound();
  const { setLoading, isPageLoaded, setAnimationComplete } = usePageLoader();
  const { openContactModal } = useContactModal();

  // 頁面載入時立即關閉 PageLoader（使用 useLayoutEffect 確保在渲染前執行）
  useLayoutEffect(() => {
    // 立即關閉 loading 狀態，錯誤頁面不需要 loading 動畫
    setLoading(false);
    setAnimationComplete(true);
    
    // 添加 body class 讓 Footer 可以使用反向色
    document.body.classList.add('page-error');
    return () => {
      document.body.classList.remove('page-error');
    };
  }, [setLoading, setAnimationComplete]);

  // Header 顏色使用反向色（on-theme-surface），會自動適應 light/dark theme
  const navColors = {
    primaryColor: 'var(--hds-sys-color-on-theme-surface)',
    secondaryColor: 'var(--hds-sys-color-theme-surface)'
  };

  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const menuHoverHandleRef = useRef<PlaybackHandle | null>(null);
  const menuClickHandleRef = useRef<PlaybackHandle | null>(null);

  // 追蹤視窗寬度
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
    if (menuAnimStates[key]) return;
    setMenuAnimStates((prev) => ({ ...prev, [key]: true }));
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

  // 預載音效
  useEffect(() => {
    audioManager.preload(hoverSoundUrl).catch(() => {});
    audioManager.preload(clickSoundUrl).catch(() => {});
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
  const languageMap = {
    'zh-Hant': 'ZH',
    'en': 'EN',
    'ja': 'JP'
  };

  const currentLangDisplay = languageMap[i18n.language as keyof typeof languageMap] || 'EN';

  const handleLanguageChange = useCallback((lang: string) => {
    const fromLang = i18n.language;
    i18n.changeLanguage(lang);
    setIsLangDropdownOpen(false);
    playMenuClickSound();
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

  // 取得錯誤內容
  const errorCode = customCode || t(`error.${errorType}.code`, { ns: 'common' });
  const errorTitle = customTitle || t(`error.${errorType}.title`, { ns: 'common' });
  const errorDescription = customDescription || t(`error.${errorType}.description`, { ns: 'common' });

  // 根據錯誤類型決定按鈕行為
  const shouldShowBackHome = errorType === '404' || errorType === 'generic';
  const shouldShowReload = errorType === '500' || errorType === 'network' || errorType === 'generic';

  // 按鈕處理函數
  const handleBackHome = useCallback(() => {
    playMenuClickSound();
    if (isPageLoaded('home')) {
      navigate('/');
    } else {
      setLoading(true);
      setTimeout(() => navigate('/'), 50);
    }
  }, [navigate, isPageLoaded, setLoading, playMenuClickSound]);

  const handleReload = useCallback(() => {
    playMenuClickSound();
    window.location.reload();
  }, [playMenuClickSound]);

  // 計算 PixelText 尺寸
  const getPixelTextSize = () => {
    if (windowWidth <= 480) {
      return { pixelSize: 4, width: 200, height: 50 };
    } else if (windowWidth <= 768) {
      return { pixelSize: 6, width: 280, height: 70 };
    } else {
      return { pixelSize: 8, width: 400, height: 100 };
    }
  };

  const pixelTextSize = getPixelTextSize();

  return (
    <div className="error-page" data-page="error">
      {/* SEO Meta Tags */}
      <SEO
        title={`${errorCode} - ${errorTitle}`}
        description={errorDescription}
        noIndex={true}
      />

      <Header
        onLogoClick={() => {
          if (isPageLoaded('home')) {
            navigate('/');
          } else {
            setLoading(true);
            setTimeout(() => navigate('/'), 50);
          }
        }}
        logoType="default"
        logoAnimated={true}
        logoColors={navColors}
        logoWrapperStyle={{
          transform: (() => {
            let scale = '';
            if (windowWidth < 480) {
              scale = 'scale(0.55)';
            } else if (windowWidth < 540) {
              scale = 'scale(0.65)';
            } else if (windowWidth < 640) {
              scale = 'scale(0.8)';
            }
            return scale || undefined;
          })(),
          transformOrigin: 'left center',
          marginRight: windowWidth < 540 ? '-35%' : windowWidth <= 640 ? '-20%' : 0
        }}
        hideNav={false}
        menuItems={['work', 'articles', 'about']}
        t={t}
        getMenuItemAnimated={(key) => !!menuAnimStates[key]}
        onMenuItemHover={(key) => { triggerMenuHoverOnce(key); playMenuHoverSound(); }}
        onMenuItemClick={(key) => {
          playMenuClickSound();
          if (key === 'work') {
            if (isPageLoaded('home')) {
              navigate('/');
            } else {
              setLoading(true);
              setTimeout(() => navigate('/'), 50);
            }
          } else if (key === 'about') {
            if (isPageLoaded('about')) {
              navigate('/about');
            } else {
              setLoading(true);
              setTimeout(() => navigate('/about'), 50);
            }
          } else if (key === 'articles') {
            if (isPageLoaded('articles')) {
              navigate('/articles');
            } else {
              setLoading(true);
              setTimeout(() => navigate('/articles'), 50);
            }
          }
        }}
        navColors={navColors}
        showThemeToggle={true}
        theme={theme}
        onToggleTheme={() => {
          playMenuClickSound();
          toggleTheme();
          trackThemeChange(theme === 'light' ? 'dark' : 'light');
        }}
        onThemeHover={() => { playMenuHoverSound(); }}
        showSoundToggle={true}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={() => {
          playMenuClickSound();
          toggleSound();
          trackSoundToggle(!isSoundEnabled);
        }}
        onSoundHover={() => { playMenuHoverSound(); }}
        showLanguageToggle={true}
        currentLangDisplay={currentLangDisplay}
        isLangDropdownOpen={isLangDropdownOpen}
        onToggleLangDropdown={toggleLangDropdown}
        langDropdownRef={langDropdownRef}
        languageOptions={[
          { code: 'en', label: 'EN' },
          { code: 'zh-Hant', label: 'ZH' },
          { code: 'ja', label: 'JP' }
        ].filter((lang) => {
          const currentLang = i18n.language.startsWith('zh') ? 'zh-Hant' : i18n.language;
          return lang.code !== currentLang;
        })}
        onLanguageChange={handleLanguageChange}
        onLanguageHover={() => { playMenuHoverSound(); }}
        onContactClick={() => {
          playMenuClickSound();
          openContactModal();
          trackContactOpen('header');
        }}
      />

      <main className="error-page__main">
        <div className="error-page__content">
          {/* 錯誤代碼 - 使用 PixelText 靜態顯示 */}
          <div className="error-page__code">
            <PixelText
              text={errorCode}
              pixelSize={pixelTextSize.pixelSize}
              width={pixelTextSize.width}
              height={pixelTextSize.height}
              animated={false}
              textEnabled={true}
              primaryColor="var(--hds-sys-color-on-theme-surface)"
            />
          </div>

          {/* 錯誤標題 */}
          <h1 className="error-page__title">{errorTitle}</h1>

          {/* 錯誤描述 */}
          <p className="error-page__description">{errorDescription}</p>

          {/* 按鈕區域 */}
          <div className="error-page__actions">
            {shouldShowBackHome && (
              <Button
                variant="primary"
                size="medium"
                onClick={handleBackHome}
              >
                {t(`error.${errorType}.backHome`, { ns: 'common', defaultValue: t('error.404.backHome', { ns: 'common' }) })}
              </Button>
            )}
            {shouldShowReload && (
              <Button
                variant={shouldShowBackHome ? 'secondary' : 'primary'}
                size="medium"
                onClick={handleReload}
              >
                {t(`error.${errorType}.reload`, { ns: 'common', defaultValue: t('error.generic.reload', { ns: 'common' }) })}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ErrorPage;
