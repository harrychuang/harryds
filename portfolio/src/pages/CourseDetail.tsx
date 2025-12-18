import React, { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { audioManager, type PlaybackHandle } from '../../../harryds/src/utils/audioManager';
import { useTheme } from '../theme/useTheme';
import { useSound } from '../hooks/useSound';
import { useCourses } from '../hooks/useCourses';
import { useHover } from '../contexts/HoverContext';
import './CourseDetail.scss';
import Header from '../components/Header';
import SEO from '../components/SEO';
import { PixelText2D, CHAR_WIDTH, CHAR_HEIGHT } from '../../../harryds/src/components/PixelText';
import hoverSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep.mp3';
import clickSoundUrl from '../../assets/sound/8-Bit Sound Effect 28-1.mp3';
import { usePageLoader } from '../contexts/PageLoaderContext';
import { useContactModal } from '../contexts/ContactModalContext';

// 避免重繪昂貴的 PixelText 畫布
const StablePixelText2D = memo(PixelText2D);

// 計算 text-box canvas 尺寸（與 FeedCardInfo 一致）
const computeTextBoxCanvasSize = (
  boxCharCount: number,
  pixelSize: number,
  pixelGap: number,
  letterSpacing: number,
  textBoxPadding: number,
) => {
  const pixelWithGap = pixelSize + pixelGap;
  const contentWidth = boxCharCount * CHAR_WIDTH * pixelWithGap - boxCharCount * pixelGap;
  const contentSpacing = Math.max(0, boxCharCount - 1) * letterSpacing * pixelSize;
  const totalContentWidth = contentWidth + contentSpacing;

  const leftPadding = textBoxPadding * pixelSize;
  const rightPadding = Math.max(0, textBoxPadding * pixelSize - pixelSize);
  const width = totalContentWidth + leftPadding + rightPadding;

  const topPadding = textBoxPadding * pixelSize;
  const bottomPadding = Math.max(0, textBoxPadding * pixelSize - pixelSize);
  const textPixelHeight = CHAR_HEIGHT * pixelWithGap - pixelGap;
  const height = textPixelHeight + topPadding + bottomPadding;

  return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) };
};

const PAGE_NAME = 'course-detail';

const CourseDetail: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ id: string; slug: string }>();
  const { t, i18n } = useTranslation(['common', 'courses']);
  const { theme, toggleTheme } = useTheme();
  const { isSoundEnabled, toggleSound } = useSound();
  const { items, loading: coursesLoading } = useCourses();
  const { setLoading, setAnimationComplete, isPageLoaded, markPageAsLoaded } = usePageLoader();
  const { openContactModal } = useContactModal();
  const { setCustomColors } = useHover();
  
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  const langDropdownRef = useRef<HTMLDivElement>(null);
  const menuHoverHandleRef = useRef<PlaybackHandle | null>(null);
  const menuClickHandleRef = useRef<PlaybackHandle | null>(null);
  const logoHoverHandleRef = useRef<PlaybackHandle | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // 追蹤視窗寬度，用於響應式尺寸調整
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1400);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // 根據 URL 參數找到對應的課程
  const course = useMemo(() => {
    const id = params.id ? parseInt(params.id, 10) : null;
    if (id === null || isNaN(id)) return null;
    return items.find(item => item.id === id);
  }, [params.id, items]);

  // 整體載入狀態
  const isFullyLoaded = !coursesLoading;
  
  // 同步 loading 狀態到全域 PageLoader
  useEffect(() => {
    const pageKey = params.id ? `${PAGE_NAME}-${params.id}` : PAGE_NAME;
    const alreadyLoaded = isPageLoaded(pageKey);
    
    if (alreadyLoaded && isFullyLoaded) {
      setLoading(false);
      setAnimationComplete(true);
    } else if (alreadyLoaded) {
      setAnimationComplete(true);
    } else {
      setLoading(!isFullyLoaded);
      if (isFullyLoaded) {
        markPageAsLoaded(pageKey);
      }
    }
  }, [isFullyLoaded, setLoading, isPageLoaded, markPageAsLoaded, setAnimationComplete, params.id]);

  // 預載音效
  useEffect(() => {
    audioManager.preload(hoverSoundUrl).catch(() => {});
    audioManager.preload(clickSoundUrl).catch(() => {});
  }, []);

  // Logo 點擊 - 返回首頁
  const handleLogoClick = useCallback(async () => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Logo click sound play failed:', err);
    }
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
        if (isPageLoaded('home')) {
          navigate('/');
        } else {
          setLoading(true);
          setTimeout(() => navigate('/'), 50);
        }
        break;
      case 'articles':
        if (isPageLoaded('articles')) {
          navigate('/articles');
        } else {
          setLoading(true);
          setTimeout(() => navigate('/articles'), 50);
        }
        break;
      case 'courses':
        if (isPageLoaded('courses')) {
          navigate('/courses');
        } else {
          setLoading(true);
          setTimeout(() => navigate('/courses'), 50);
        }
        break;
      case 'about':
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
  const handleMenuItemHover = useCallback(async () => {
    try {
      menuHoverHandleRef.current?.stop();
      menuHoverHandleRef.current = await audioManager.play(hoverSoundUrl, { volume: 0.2 });
    } catch (err) {
      console.warn('Menu hover sound play failed:', err);
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

  // Logo wrapper 樣式
  const logoWrapperStyle: React.CSSProperties = {
    cursor: 'pointer',
    transform: (() => {
      const translateX = 'translateX(0px)';
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
    marginRight: windowWidth < 540 ? '-35%' : windowWidth <= 640 ? '-20%' : 0
  };

  // Logo hover 處理
  const handleLogoHover = useCallback(async () => {
    setIsLogoHovered(true);
    try {
      logoHoverHandleRef.current?.stop();
      logoHoverHandleRef.current = await audioManager.play(hoverSoundUrl, { volume: 0.4 });
    } catch (err) {
      console.warn('Logo hover sound play failed:', err);
    }
  }, []);

  const handleLogoLeave = useCallback(() => {
    setIsLogoHovered(false);
  }, []);

  // 返回 Courses 列表
  const handleBackToCourses = useCallback(async () => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Back button sound play failed:', err);
    }
    navigate('/courses');
  }, [navigate]);

  // FAQ 展開/收合
  const handleFaqToggle = useCallback(async (index: number) => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('FAQ toggle sound play failed:', err);
    }
    setExpandedFaqIndex(prev => prev === index ? null : index);
  }, []);

  // 資料載入中，不渲染任何內容
  if (!isFullyLoaded) {
    return null;
  }

  // 資料載入完成但找不到課程，顯示錯誤
  if (!course) {
    return (
      <div className="course-detail">
        <Header
          onLogoClick={handleBackToCourses}
          onLogoMouseEnter={handleLogoHover}
          onLogoMouseLeave={handleLogoLeave}
          logoType="back"
          logoAnimated={isLogoHovered}
          logoWrapperStyle={logoWrapperStyle}
          menuItems={['work', 'articles', 'courses', 'about']}
          activeMenuItem="courses"
          t={t}
          onMenuItemHover={handleMenuItemHover}
          onMenuItemClick={handleMenuItemClick}
          showThemeToggle={true}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onThemeHover={handleMenuItemHover}
          showSoundToggle={true}
          isSoundEnabled={isSoundEnabled}
          onToggleSound={toggleSound}
          onSoundHover={handleMenuItemHover}
          showLanguageToggle={true}
          currentLangDisplay={currentLangDisplay}
          isLangDropdownOpen={isLangDropdownOpen}
          onToggleLangDropdown={handleToggleLangDropdown}
          langDropdownRef={langDropdownRef}
          languageOptions={languageOptions}
          onLanguageChange={handleLanguageChange}
          onLanguageHover={handleMenuItemHover}
          onContactClick={() => { openContactModal(); }}
        />
        <main className="course-detail__content">
          <div className="course-detail__container">
            <h1>Course not found</h1>
            <p>The course you are looking for does not exist.</p>
          </div>
        </main>
      </div>
    );
  }

  // 課程顏色
  const primaryColor = course.primaryColor || '#667FFF';
  const secondaryColor = course.secondaryColor || '#111';

  // 根據 theme 決定背景色和文字顏色
  const isLightTheme = theme === 'light';
  const backgroundColor = isLightTheme ? '#fff' : secondaryColor;
  // Light theme: 白色背景 → 深色文字; Dark theme: 深色背景 → 淺色文字
  const contentColor = isLightTheme ? '#111' : '#fff';

  // Header 和 Logo 顏色
  const headerColors = {
    primaryColor,
    secondaryColor: backgroundColor,
  };

  // Tags 顯示文字（與 FeedCardInfo 一致的格式）
  const TAG_SYMBOL = '◼';
  const tagsDisplayText = useMemo(() => {
    const list = Array.isArray(course.tags) ? course.tags : [];
    return list
      .map((original) => `${TAG_SYMBOL} ${original}`)
      .join('  ');
  }, [course.tags]);

  // Tags canvas 尺寸計算
  const tagsPx = windowWidth <= 767 ? 2 : 2;
  const pixelGap = 0;
  const tagsTextBoxPadding = 5;
  const letterSpacing = 1;
  const textBoxWidth = Math.max(6, tagsDisplayText.length);
  const tagCanvas = useMemo(() => (
    computeTextBoxCanvasSize(
      textBoxWidth,
      tagsPx,
      pixelGap,
      letterSpacing,
      tagsTextBoxPadding,
    )
  ), [textBoxWidth, tagsPx]);

  // 設定 Footer 顏色為課程的 primaryColor 和 secondaryColor
  useEffect(() => {
    setCustomColors({
      primaryColor,
      secondaryColor: backgroundColor,
    });
    
    // 離開頁面時清除自定義顏色
    return () => {
      setCustomColors(null);
    };
  }, [primaryColor, backgroundColor, setCustomColors]);

  return (
    <div 
      className="course-detail"
      style={{
        ['--course-primary-color' as any]: primaryColor,
        ['--course-secondary-color' as any]: backgroundColor,
        ['--course-content-color' as any]: contentColor,
      }}
    >
      {/* SEO Meta Tags */}
      <SEO
        title={course.heading.replace(/\n/g, ' ')}
        description={course.valueProposition.title}
        image={course.heroImage}
        path={`course/${course.id}/${params.slug}`}
        type="article"
        keywords={course.tags}
      />
      
      <Header
        onLogoClick={handleBackToCourses}
        onLogoMouseEnter={handleLogoHover}
        onLogoMouseLeave={handleLogoLeave}
        logoType="back"
        logoAnimated={isLogoHovered}
        logoColors={headerColors}
        logoWrapperStyle={logoWrapperStyle}
        navColors={headerColors}
        menuItems={[]}
        t={t}
        onMenuItemHover={handleMenuItemHover}
        onMenuItemClick={handleMenuItemClick}
        showThemeToggle={true}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onThemeHover={handleMenuItemHover}
        showSoundToggle={false}
        showLanguageToggle={true}
        currentLangDisplay={currentLangDisplay}
        isLangDropdownOpen={isLangDropdownOpen}
        onToggleLangDropdown={handleToggleLangDropdown}
        langDropdownRef={langDropdownRef}
        languageOptions={languageOptions}
        onLanguageChange={handleLanguageChange}
        onLanguageHover={handleMenuItemHover}
        onContactClick={() => { openContactModal(); }}
      />

      <main ref={scrollContainerRef} className="course-detail__content">
        {/* Hero Section - 類似 FeedDetailOverlay 的 hero */}
        <section className="course-detail__hero">
          <div className="course-detail__hero-container">
            <div className="course-detail__hero-tags">
              <StablePixelText2D
                text=""
                textEnabled={false}
                textBoxEnabled
                textBox={tagsDisplayText}
                textBoxWidth={textBoxWidth}
                textBoxPadding={tagsTextBoxPadding}
                pixelSize={tagsPx}
                pixelGap={pixelGap}
                letterSpacing={letterSpacing}
                primaryColor={primaryColor}
                onPrimaryColor={backgroundColor}
                width={tagCanvas.width}
                height={tagCanvas.height}
                spaceWidth={3}
              />
            </div>
            <div className="course-detail__hero-info">
              <h1 className="course-detail__heading">{course.heading}</h1>
              <p className="course-detail__subtitle">{course.valueProposition.title}</p>
            </div>
          </div>
        </section>

        {/* Main Content - 兩欄布局參考 FeedDetailOverlay */}
        <section className="course-detail__main">
          <div className="course-detail__container">
            {/* 左欄 - Meta 資訊 (sticky) */}
            <aside className="course-detail__meta">
              <div className="course-detail__meta-content">
                <div className="course-detail__meta-item">
                  <h3 className="course-detail__meta-label">{t('common:instructor', 'Instructor')}</h3>
                  <p className="course-detail__meta-value">{course.instructor}</p>
                </div>
                <div className="course-detail__meta-item">
                  <h3 className="course-detail__meta-label">{t('common:schedule', 'Schedule')}</h3>
                  <p className="course-detail__meta-value">{course.pricing.schedule}</p>
                </div>
                <div className="course-detail__meta-item">
                  <h3 className="course-detail__meta-label">{t('common:location', 'Location')}</h3>
                  <p className="course-detail__meta-value">{course.pricing.location}</p>
                </div>
                <div className="course-detail__meta-item">
                  <h3 className="course-detail__meta-label">{t('common:format', 'Format')}</h3>
                  <p className="course-detail__meta-value">{course.valueProposition.format}</p>
                </div>
              </div>

              {/* 價格資訊 */}
              <div className="course-detail__pricing">
                <div className="course-detail__price-original">
                  <span className="course-detail__price-label">{t('common:originalPrice', 'Original')}</span>
                  <span className="course-detail__price-value course-detail__price-value--strikethrough">{course.pricing.original}</span>
                </div>
                <div className="course-detail__price-earlybird">
                  <span className="course-detail__price-label">{t('common:earlyBird', 'Early Bird')}</span>
                  <span className="course-detail__price-value course-detail__price-value--highlight">{course.pricing.earlyBird}</span>
                </div>
                <p className="course-detail__pricing-note">{course.pricing.note}</p>
              </div>

              {/* CTA 按鈕 */}
              <button 
                className="course-detail__cta-button"
                onClick={() => { openContactModal(); }}
                onMouseEnter={handleMenuItemHover}
              >
                {t('common:contactForCourse', 'Contact to Register')}
              </button>
            </aside>

            {/* 右欄 - 主要內容 */}
            <div className="course-detail__body">
              {/* Hero 圖片 */}
              {course.heroImage && (
                <div className="course-detail__image">
                  <img 
                    src={course.heroImage} 
                    alt={course.heading}
                    className="course-detail__img"
                  />
                </div>
              )}

              {/* USP Section - 課程重點 */}
              <div className="course-detail__section">
                <h2 className="course-detail__section-title">
                  {t('common:courseHighlights', 'Course Highlights')}
                  <span className="course-detail__cursor">_</span>
                </h2>
                <div className="course-detail__section-content">
                  {course.usp.map((item, index) => (
                    <div key={index} className="course-detail__usp-item">
                      <span className="course-detail__usp-number">{String(index + 1).padStart(2, '0')}</span>
                      <div className="course-detail__usp-content">
                        <h3 className="course-detail__usp-title">{item.title}</h3>
                        <p className="course-detail__usp-description">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Syllabus Section */}
              <div className="course-detail__section">
                <h2 className="course-detail__section-title">
                  {t('common:syllabus', 'Syllabus')}
                  <span className="course-detail__cursor">_</span>
                </h2>
                <div className="course-detail__section-content">
                  {course.syllabus.map((day, dayIndex) => (
                    <div key={dayIndex} className="course-detail__day">
                      <div className="course-detail__day-header">
                        <span className="course-detail__day-label">{day.day}</span>
                        <h3 className="course-detail__day-title">{day.title}</h3>
                      </div>
                      <div className="course-detail__sessions">
                        {day.sessions.map((session, sessionIndex) => (
                          <div key={sessionIndex} className="course-detail__session">
                            <span className="course-detail__session-time">{session.time}</span>
                            <p className="course-detail__session-content">{session.content}</p>
                          </div>
                        ))}
                      </div>
                      <div className="course-detail__outcome">
                        <span className="course-detail__outcome-label">{t('common:outcome', 'Outcome')}</span>
                        <p className="course-detail__outcome-text">{day.outcome}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ Section */}
              <div className="course-detail__section">
                <h2 className="course-detail__section-title">
                  {t('common:faq', 'FAQ')}
                  <span className="course-detail__cursor">_</span>
                </h2>
                <div className="course-detail__section-content">
                  <div className="course-detail__faq">
                    {course.faq.map((item, index) => (
                      <div 
                        key={index} 
                        className={`course-detail__faq-item ${expandedFaqIndex === index ? 'course-detail__faq-item--expanded' : ''}`}
                      >
                        <button 
                          className="course-detail__faq-question"
                          onClick={() => handleFaqToggle(index)}
                          onMouseEnter={handleMenuItemHover}
                        >
                          <span className="course-detail__faq-q">Q</span>
                          <span className="course-detail__faq-text">{item.question}</span>
                          <span className="course-detail__faq-icon">{expandedFaqIndex === index ? '−' : '+'}</span>
                        </button>
                        <div className="course-detail__faq-answer">
                          <span className="course-detail__faq-a">A</span>
                          <p className="course-detail__faq-answer-text">{item.answer}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CourseDetail;
