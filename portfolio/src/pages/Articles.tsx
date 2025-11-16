import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { audioManager, type PlaybackHandle } from '../../../harryds/src/utils/audioManager';
import { useTheme } from '../theme/useTheme';
import { useI18nFeed } from '../hooks/useI18nFeed';
import { FeedCard } from 'hds';
import type { FeedCardSize } from 'hds';
import './Articles.scss';
import Header from '../components/Header';
import hoverSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep.mp3';
import clickSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep 3.mp3';

const Articles: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['common', 'articles']);
  const { theme, toggleTheme } = useTheme();
  const { items } = useI18nFeed('articles');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const menuHoverHandleRef = useRef<PlaybackHandle | null>(null);
  const menuClickHandleRef = useRef<PlaybackHandle | null>(null);

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
        // 已經在 articles 頁面
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

  // 卡片點擊處理
  const handleCardClick = useCallback(async (articleId: number) => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Card click sound play failed:', err);
    }
    
    const article = items.find(item => item.id === articleId);
    if (article) {
      // 使用原始英文 heading 生成 slug，確保所有語系的 URL 一致
      const headingForSlug = (article as any).originalHeading || article.heading;
      const slug = headingForSlug.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      navigate(`/article/${articleId}/${slug}`);
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
    <div className="articles-page">
      <Header
        onLogoClick={handleLogoClick}
        logoType="default"
        logoAnimated={true}
        menuItems={['work', 'articles', 'about']}
        activeMenuItem="articles"
        t={t}
        onMenuItemHover={handleMenuItemHover}
        onMenuItemClick={handleMenuItemClick}
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

      <main className="articles-page__content">
        <div className="articles-page__grid">
          {items.map((article, index) => {
            // 前兩個為 medium size，其餘為 xs
            const size: FeedCardSize = index < 2 ? 'med' : 'xs';
            const height = index < 2 ? 500 : 250;
            const src = article.heroImage || '';
            
            // 計算是否為最後幾個卡片（避免最後只剩 1 個）
            const totalXsCards = items.length - 2;
            const remainder = totalXsCards % 3;
            const isInLastGroup = remainder === 1 && index >= items.length - 4;
            
            // 決定 className
            let cardClass = 'article-card';
            if (index < 2) {
              cardClass += ' article-card--featured';
            } else if (isInLastGroup) {
              cardClass += ' article-card--last-group';
            }
            
            return (
              <div
                key={article.id}
                className={cardClass}
                onClick={() => handleCardClick(article.id)}
                style={{
                  ['--stagger-index' as any]: index,
                }}
              >
                <FeedCard
                  src={src}
                  size={size}
                  height={height}
                  padding={40}
                  backgroundProps={{
                    pixelSize: 60,
                    hoverPixelToOne: true,
                    hoverPixelDuration: 500,
                    desaturateUntilHover: true,
                    objectFit: 'cover'
                  }}
                  infoMaxWidth={1400}
                  infoData={{
                    id: '',
                    heading: article.heading,
                    date: article.date,
                    tags: [],
                    category: article.category
                  }}
                  use2D={true}
                />
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Articles;

