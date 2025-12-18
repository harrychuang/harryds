import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { audioManager, type PlaybackHandle } from '../../../harryds/src/utils/audioManager';
import { useTheme } from '../theme/useTheme';
import { useSound } from '../hooks/useSound';
import { useCourses } from '../hooks/useCourses';
import { FeedCard } from 'hds';
import type { FeedCardSize } from 'hds';
import './Courses.scss';
import Header from '../components/Header';
import SEO, { useSEOPresets } from '../components/SEO';
import hoverSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep.mp3';
import clickSoundUrl from '../../assets/sound/8-Bit Sound Effect 28-1.mp3';
import { usePageLoader } from '../contexts/PageLoaderContext';
import { useContactModal } from '../contexts/ContactModalContext';
import { useHover } from '../contexts/HoverContext';

const PAGE_NAME = 'courses';

// 預設課程顏色（當課程沒有設定顏色時使用）
const DEFAULT_PRIMARY_COLOR = '#667FFF';
const DEFAULT_SECONDARY_COLOR = '#111';

const Courses: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['common', 'courses']);
  const { theme, toggleTheme } = useTheme();
  const { isSoundEnabled, toggleSound } = useSound();
  const { items, loading: coursesLoading } = useCourses();
  const { setLoading, isPageLoaded, markPageAsLoaded, setAnimationComplete } = usePageLoader();
  const { openContactModal } = useContactModal();
  const { setCustomColors } = useHover();
  
  // SEO Presets (i18n)
  const seoPresets = useSEOPresets();
  
  // Hover 狀態追蹤
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  
  // 頁面進入時檢查是否已載入過
  useEffect(() => {
    const alreadyLoaded = isPageLoaded(PAGE_NAME);
    
    if (alreadyLoaded) {
      // 頁面已載入過，直接跳過 loading
      setLoading(false);
      setAnimationComplete(true);
    } else if (!coursesLoading) {
      // 首次載入且資料已準備好
      setLoading(false);
      markPageAsLoaded(PAGE_NAME);
    }
  }, [coursesLoading, isPageLoaded, setLoading, setAnimationComplete, markPageAsLoaded]);

  // 組件卸載時清除自定義顏色
  useEffect(() => {
    return () => {
      setCustomColors(null);
    };
  }, [setCustomColors]);

  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [menuAnimStates, setMenuAnimStates] = useState<Record<string, boolean>>({});
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // 追蹤視窗寬度，用於響應式 logo 尺寸調整
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1400);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const menuHoverHandleRef = useRef<PlaybackHandle | null>(null);
  const menuClickHandleRef = useRef<PlaybackHandle | null>(null);
  const menuHoverTimersRef = useRef<Record<string, number>>({});

  // 獲取當前 hover 課程的顏色
  const hoveredCourse = useMemo(() => {
    if (!hoveredCardId) return null;
    return items.find(item => item.id === hoveredCardId) || null;
  }, [hoveredCardId, items]);

  const currentPrimaryColor = hoveredCourse?.primaryColor || DEFAULT_PRIMARY_COLOR;
  const currentSecondaryColor = hoveredCourse?.secondaryColor || DEFAULT_SECONDARY_COLOR;

  // Hover 時更新背景色和 Footer 顏色
  useEffect(() => {
    if (!pageRef.current) return;
    
    if (hoveredCardId && hoveredCourse) {
      const secondaryColor = hoveredCourse.secondaryColor || DEFAULT_SECONDARY_COLOR;
      const primaryColor = hoveredCourse.primaryColor || DEFAULT_PRIMARY_COLOR;

      // 更新 .courses-page 元素背景色
      pageRef.current.style.backgroundColor = secondaryColor;
      pageRef.current.style.transition = 'background-color 0.3s ease';

      // 同時更新 html 和 body 背景色
      document.documentElement.style.backgroundColor = secondaryColor;
      document.documentElement.style.transition = 'background-color 0.3s ease';
      document.body.style.backgroundColor = secondaryColor;
      document.body.style.transition = 'background-color 0.3s ease';

      // 更新 Footer 顏色（通過 HoverContext）
      setCustomColors({
        primaryColor,
        secondaryColor,
      });
    } else {
      // 恢復原始背景色
      pageRef.current.style.backgroundColor = '';
      pageRef.current.style.transition = 'background-color 0.3s ease';

      // 清除 html 和 body 的背景色
      document.documentElement.style.backgroundColor = '';
      document.documentElement.style.transition = 'background-color 0.3s ease';
      document.body.style.backgroundColor = '';
      document.body.style.transition = 'background-color 0.3s ease';

      // 清除 Footer 顏色
      setCustomColors(null);
    }

    // 清理函數：組件卸載時恢復原始背景色
    return () => {
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    };
  }, [hoveredCardId, hoveredCourse, setCustomColors]);

  // 計算 Header 和 Logo 的顏色
  const headerColors = useMemo(() => {
    if (hoveredCardId && hoveredCourse) {
      return {
        primaryColor: currentPrimaryColor,
        secondaryColor: currentSecondaryColor,
      };
    }
    return {};
  }, [hoveredCardId, hoveredCourse, currentPrimaryColor, currentSecondaryColor]);

  // 語言切換相關
  const languageMap = {
    'zh-Hant': 'ZH',
    'en': 'EN',
    'ja': 'JP'
  };

  const currentLangDisplay = languageMap[i18n.language as keyof typeof languageMap] || 'EN';

  // 語言選項（排除當前語言）
  const languageOptions = React.useMemo(() => ([
    { code: 'en', label: 'EN' },
    { code: 'zh-Hant', label: 'ZH' },
    { code: 'ja', label: 'JP' }
  ].filter((lang) => {
    const currentLang = i18n.language.startsWith('zh') ? 'zh-Hant' : i18n.language;
    return lang.code !== currentLang;
  })), [i18n.language]);

  // 預載音效
  useEffect(() => {
    audioManager.preload(hoverSoundUrl).catch(() => {});
    audioManager.preload(clickSoundUrl).catch(() => {});
  }, []);

  // 導覽選單 hover 觸發一次動畫狀態
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

  // Logo 點擊 - 返回首頁
  const handleLogoClick = useCallback(async () => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Logo click sound play failed:', err);
    }
    // 如果頁面已載入過，直接導航；否則先觸發 loading
    if (isPageLoaded('home')) {
      navigate('/');
    } else {
      setLoading(true);
      setTimeout(() => navigate('/'), 50);
    }
  }, [navigate, setLoading, isPageLoaded]);

  // 導覽選單點擊
  const handleMenuItemClick = useCallback(async (itemKey: string) => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Menu click sound play failed:', err);
    }

    switch (itemKey) {
      case 'work':
        // 如果頁面已載入過，直接導航；否則先觸發 loading
        if (isPageLoaded('home')) {
          navigate('/');
        } else {
          setLoading(true);
          setTimeout(() => navigate('/'), 50);
        }
        break;
      case 'articles':
        // 如果頁面已載入過，直接導航；否則先觸發 loading
        if (isPageLoaded('articles')) {
          navigate('/articles');
        } else {
          setLoading(true);
          setTimeout(() => navigate('/articles'), 50);
        }
        break;
      case 'courses':
        // 已經在 courses 頁面
        break;
      case 'about':
        // 如果頁面已載入過，直接導航；否則先觸發 loading
        if (isPageLoaded('about')) {
          navigate('/about');
        } else {
          setLoading(true);
          setTimeout(() => navigate('/about'), 50);
        }
        break;
    }
  }, [navigate, setLoading, isPageLoaded]);

  // Hover 音效
  const playMenuHoverSound = useCallback(async () => {
    try {
      menuHoverHandleRef.current?.stop();
      menuHoverHandleRef.current = await audioManager.play(hoverSoundUrl, { volume: 0.4 });
    } catch (err) {
      console.warn('Menu hover sound play failed:', err);
    }
  }, []);

  // Click 音效
  const playMenuClickSound = useCallback(async () => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Menu click sound play failed:', err);
    }
  }, []);

  // 主題切換
  const handleToggleTheme = useCallback(async () => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Theme toggle sound play failed:', err);
    }
    toggleTheme();
  }, [toggleTheme]);

  // 語言切換
  const handleToggleLangDropdown = useCallback(async () => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Lang dropdown toggle sound play failed:', err);
    }
    setIsLangDropdownOpen((prev) => !prev);
  }, []);

  const handleLanguageChange = useCallback(async (code: string) => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Language change sound play failed:', err);
    }
    i18n.changeLanguage(code);
    setIsLangDropdownOpen(false);
  }, [i18n]);

  // 卡片 Hover 處理
  const handleCardHover = useCallback((courseId: number) => {
    setHoveredCardId(courseId);
    playMenuHoverSound();
  }, [playMenuHoverSound]);

  const handleCardLeave = useCallback(() => {
    setHoveredCardId(null);
  }, []);

  // 卡片點擊處理
  const handleCardClick = useCallback(async (courseId: number) => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Card click sound play failed:', err);
    }
    
    const course = items.find(item => item.id === courseId);
    if (course) {
      // 使用原始英文 heading 生成 slug，確保所有語系的 URL 一致
      const headingForSlug = course.originalHeading || course.heading;
      const slug = headingForSlug.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      navigate(`/course/${courseId}/${slug}`);
    }
  }, [items, navigate]);

  // 點擊外部關閉語言下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={pageRef} className="courses-page">
      {/* SEO Meta Tags */}
      <SEO {...seoPresets.courses} />
      
      <Header
        onLogoClick={handleLogoClick}
        logoType="default"
        logoAnimated={true}
        logoColors={headerColors as any}
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
        navColors={headerColors as any}
        menuItems={['articles', 'courses']}
        activeMenuItem="courses"
        t={t}
        getMenuItemAnimated={(key) => !!menuAnimStates[key]}
        onMenuItemHover={(key) => { triggerMenuHoverOnce(key); playMenuHoverSound(); }}
        onMenuItemClick={handleMenuItemClick}
        showThemeToggle={true}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onThemeHover={() => { playMenuHoverSound(); }}
        showSoundToggle={true}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={toggleSound}
        onSoundHover={() => { playMenuHoverSound(); }}
        showLanguageToggle={true}
        currentLangDisplay={currentLangDisplay}
        isLangDropdownOpen={isLangDropdownOpen}
        onToggleLangDropdown={handleToggleLangDropdown}
        langDropdownRef={langDropdownRef}
        languageOptions={languageOptions}
        onLanguageChange={handleLanguageChange}
        onLanguageHover={() => { playMenuHoverSound(); }}
        onContactClick={() => { 
          playMenuClickSound(); 
          openContactModal(); 
        }}
      />

      <main className="courses-page__content">
        <div className="courses-page__grid">
          {items.map((course, index) => {
            // 課程卡片使用 sm 尺寸
            const size: FeedCardSize = 'sm';
            const height = windowWidth <= 767 ? 300 : 400;
            
            // 使用 images 中的第一張圖作為背景
            const src = course.images?.[0] || course.heroImage || '';
            
            return (
              <div
                key={course.id}
                className="course-card"
                onClick={() => handleCardClick(course.id)}
                onMouseEnter={() => handleCardHover(course.id)}
                onMouseLeave={handleCardLeave}
                style={{
                  ['--stagger-index' as any]: index,
                  ['--card-primary-color' as any]: course.primaryColor || DEFAULT_PRIMARY_COLOR,
                }}
              >
                <FeedCard
                  src={src}
                  size={size}
                  height={height}
                  padding={40}
                  backgroundProps={{
                    pixelSize: 60,
                    hoverToOriginal: true,
                    hoverDuration: 500,
                    desaturateUntilHover: true,
                    objectFit: 'cover'
                  }}
                  primaryColor={course.primaryColor || DEFAULT_PRIMARY_COLOR}
                  secondaryColor={course.secondaryColor || DEFAULT_SECONDARY_COLOR}
                  infoMaxWidth={1400}
                  infoData={{
                    id: '',
                    heading: course.heading,
                    date: course.date,
                    tags: course.tags,
                    category: course.category
                  }}
                />
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Courses;
