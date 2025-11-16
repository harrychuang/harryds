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

  // 語言選項
  const languageOptions = [
    { code: 'en', label: 'EN' },
    { code: 'zh-Hant', label: '繁中' },
    { code: 'ja', label: '日本語' },
  ];

  const currentLangDisplay = i18n.language === 'zh-Hant' ? '繁中' : i18n.language === 'ja' ? '日本語' : 'EN';

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
      // 生成文章的 slug
      const slug = article.heading.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
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
            const size: FeedCardSize = 'xs';
            const src = article.heroImage || '';
            
            return (
              <div
                key={article.id}
                className="article-card"
                onClick={() => handleCardClick(article.id)}
                style={{
                  ['--stagger-index' as any]: index,
                }}
              >
                <FeedCard
                  src={src}
                  size={size}
                  height={250}
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

