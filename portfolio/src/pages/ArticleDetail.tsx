import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { audioManager, type PlaybackHandle } from '../../../harryds/src/utils/audioManager';
import { useTheme } from '../theme/useTheme';
import { useI18nFeed } from '../hooks/useI18nFeed';
import './ArticleDetail.scss';
import Header from '../components/Header';
import hoverSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep.mp3';
import clickSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep 3.mp3';

const ArticleDetail: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ id: string; slug: string }>();
  const { t, i18n } = useTranslation(['common', 'articles']);
  const { theme, toggleTheme } = useTheme();
  const { items } = useI18nFeed('articles');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const menuHoverHandleRef = useRef<PlaybackHandle | null>(null);
  const menuClickHandleRef = useRef<PlaybackHandle | null>(null);
  const logoHoverHandleRef = useRef<PlaybackHandle | null>(null);

  // 語言切換相關
  const languageMap = {
    'zh-Hant': 'ZH',
    'zh': 'ZH',
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
    const currentLang = i18n.language === 'zh' ? 'zh-Hant' : i18n.language;
    return lang.code !== currentLang;
  })), [i18n.language]);

  // 根據 URL 參數找到對應的文章
  const article = useMemo(() => {
    const id = params.id ? parseInt(params.id, 10) : null;
    if (id === null || isNaN(id)) return null;
    return items.find(item => item.id === id);
  }, [params.id, items]);

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
    navigate('/');
  }, [navigate]);

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
        navigate('/');
        break;
      case 'articles':
        navigate('/articles');
        break;
      case 'about':
        navigate('/about');
        break;
    }
  }, [navigate]);

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

  // Logo wrapper 樣式（參考 Home 的 project detail）
  const logoWrapperStyle: React.CSSProperties = {
    cursor: 'pointer',
    transform: 'translateX(-10px)'
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

  // 返回 Articles 列表
  const handleBackToArticles = useCallback(async () => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Back button sound play failed:', err);
    }
    navigate('/articles');
  }, [navigate]);

  // 獲取文章圖片
  const articleImages = useMemo(() => {
    const articleData = t(`${article?.id}`, { returnObjects: true, ns: 'articles' }) as any;
    return articleData?.images || [];
  }, [article, t]);

  // 獲取文章內容
  const articleContent = useMemo(() => {
    const articleData = t(`${article?.id}`, { returnObjects: true, ns: 'articles' }) as any;
    const content = articleData?.content || {};
    return Object.values(content).filter(Boolean) as string[];
  }, [article, t]);

  // Carousel 控制
  const handlePrevImage = useCallback(async () => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Prev button sound play failed:', err);
    }
    setCurrentImageIndex((prev) => (prev === 0 ? articleImages.length - 1 : prev - 1));
  }, [articleImages.length]);

  const handleNextImage = useCallback(async () => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Next button sound play failed:', err);
    }
    setCurrentImageIndex((prev) => (prev === articleImages.length - 1 ? 0 : prev + 1));
  }, [articleImages.length]);

  const handlePageClick = useCallback(async (index: number) => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Page click sound play failed:', err);
    }
    setCurrentImageIndex(index);
  }, []);

  // 計算 transform 讓 active 圖片在最左邊
  const carouselTransform = useMemo(() => {
    const imageWidth = 600; // max-width
    const gap = 50;
    const offset = currentImageIndex * (imageWidth + gap);
    return `translateX(-${offset}px)`;
  }, [currentImageIndex]);

  // 如果找不到文章，顯示錯誤
  if (!article) {
    return (
      <div className="article-detail">
        <Header
          onLogoClick={handleBackToArticles}
          onLogoMouseEnter={handleLogoHover}
          onLogoMouseLeave={handleLogoLeave}
          logoType="back"
          logoAnimated={isLogoHovered}
          logoWrapperStyle={logoWrapperStyle}
          menuItems={[]}
          showThemeToggle={true}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onThemeHover={handleMenuItemHover}
          showLanguageToggle={true}
          currentLangDisplay={currentLangDisplay}
          isLangDropdownOpen={isLangDropdownOpen}
          onToggleLangDropdown={handleToggleLangDropdown}
          langDropdownRef={langDropdownRef}
          languageOptions={languageOptions}
          onLanguageChange={handleLanguageChange}
          onLanguageHover={handleMenuItemHover}
        />
        <main className="article-detail__content">
          <div className="article-detail__container">
            <h1>Article not found</h1>
            <p>The article you are looking for does not exist.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="article-detail">
      <Header
        onLogoClick={handleBackToArticles}
        onLogoMouseEnter={handleLogoHover}
        onLogoMouseLeave={handleLogoLeave}
        logoType="back"
        logoAnimated={isLogoHovered}
        logoWrapperStyle={logoWrapperStyle}
        menuItems={[]}
        showThemeToggle={true}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onThemeHover={handleMenuItemHover}
        showLanguageToggle={true}
        currentLangDisplay={currentLangDisplay}
        isLangDropdownOpen={isLangDropdownOpen}
        onToggleLangDropdown={handleToggleLangDropdown}
        langDropdownRef={langDropdownRef}
        languageOptions={languageOptions}
        onLanguageChange={handleLanguageChange}
        onLanguageHover={handleMenuItemHover}
      />

      <main className="article-detail__content">
        <div className="article-detail__container">
          <h1 className="article-detail__heading">{article.heading}</h1>
          {article.subtitle && (
            <p className="article-detail__subtitle">{article.subtitle}</p>
          )}
          
          <div className="article-detail__info">
            <div className="article-detail__info-column">
              <div className="article-detail__info-label">Date</div>
              <div className="article-detail__info-value">{article.date}</div>
            </div>
            <div className="article-detail__info-column">
              <div className="article-detail__info-label">Topics</div>
              <div className="article-detail__info-value">
                {article.tags.map((tag, index) => (
                  <React.Fragment key={index}>
                    {tag}
                    {index < article.tags.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="article-detail__info-column">
              {/* 第三個 column 先空白 */}
            </div>
          </div>

          {/* Image Carousel */}
          {articleImages.length > 0 && (
            <div className="article-detail__carousel">
              <div className="article-detail__carousel-wrapper">
                <div 
                  className="article-detail__carousel-images"
                  style={{ transform: carouselTransform }}
                >
                  {articleImages.map((image: string, index: number) => (
                    <img
                      key={index}
                      src={`/assets/imgs/${image}`}
                      alt={`${article.heading} - Image ${index + 1}`}
                      className="article-detail__carousel-image"
                    />
                  ))}
                </div>
              </div>

              <div className="article-detail__carousel-actions">
                <div className="article-detail__carousel-pagination">
                  {articleImages.map((_: any, index: number) => (
                    <div
                      key={index}
                      className={`article-detail__carousel-page ${
                        index === currentImageIndex ? 'active' : ''
                      }`}
                      onClick={() => handlePageClick(index)}
                    />
                  ))}
                </div>

                <div className="article-detail__carousel-controls">
                  <button
                    className="article-detail__carousel-control"
                    onClick={handlePrevImage}
                    onMouseEnter={handleMenuItemHover}
                    aria-label="Previous image"
                  >
                    &lt;
                  </button>

                  <button
                    className="article-detail__carousel-control"
                    onClick={handleNextImage}
                    onMouseEnter={handleMenuItemHover}
                    aria-label="Next image"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Article Content */}
          {articleContent.length > 0 && (
            <div className="article-detail__content-section">
              {articleContent.map((paragraph, index) => (
                <p key={index} className="article-detail__paragraph">
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ArticleDetail;

