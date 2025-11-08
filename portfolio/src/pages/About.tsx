import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo, PixelText2D } from 'hds';
import { audioManager, type PlaybackHandle } from '../../../harryds/src/utils/audioManager';
import { useTheme } from '../theme/useTheme';
import hoverSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep.mp3';
import clickSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep 3.mp3';
import '../pages/Home.scss';

const About: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const menuHoverHandleRef = useRef<PlaybackHandle | null>(null);
  const menuClickHandleRef = useRef<PlaybackHandle | null>(null);

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

  // 預載音效
  useEffect(() => {
    audioManager.preload(hoverSoundUrl).catch(() => {});
    audioManager.preload(clickSoundUrl).catch(() => {});
  }, []);

  // 語言切換相關
  const languageMap = {
    'zh-Hant': 'ZH',
    'zh': 'ZH',
    'en': 'EN',
    'ja': 'JP'
  };

  const currentLangDisplay = languageMap[i18n.language as keyof typeof languageMap] || 'EN';

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

  return (
    <div className="home">
      <header className="home__header">
        <div className="header-content">
          <div 
            onClick={() => navigate('/')}
            className="logo-wrapper"
            style={{ cursor: 'pointer' }}
          >
            <Logo 
              type="default"
              animated={true}
            />
          </div>
          <nav className="home__nav">
            {['home', 'works', 'article', 'about'].map((item) => {
              const menuText = t(`nav.${item}`);
              const charCount = menuText.length;
              const calculatedWidth = charCount * 16 + Math.max(0, charCount - 1) * 2;
              
              return (
                <div
                  key={item}
                  className="home__nav-item"
                  onMouseEnter={() => { triggerMenuHoverOnce(item); playMenuHoverSound(); }}
                  onClick={() => { 
                    playMenuClickSound();
                    if (item === 'home') {
                      navigate('/');
                    } else if (item === 'about') {
                      navigate('/about');
                    }
                  }}
                >
                  <PixelText2D
                    text={menuText}
                    textEnabled
                    pixelSize={2}
                    width={calculatedWidth}
                    height={24}
                    animated={!!menuAnimStates[item]}
                    totalAnimationDuration={400}
                  />
                </div>
              );
            })}
            
            {/* Theme toggle button */}
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
              >
                <PixelText2D
                  text={theme === 'dark' ? '☽' : '☀'}
                  textEnabled
                  pixelSize={2}
                  letterSpacing={0}
                  width={36}
                  height={36}
                  animated={false}
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
              >
                <PixelText2D
                  text={currentLangDisplay}
                  textEnabled
                  pixelSize={2}
                  letterSpacing={0}
                  width={32}
                  height={24}
                  animated={false}
                />
              </div>
              
              {/* Dropdown menu */}
              {isLangDropdownOpen && (
                <div className="lang-dropdown">
                  {[
                    { code: 'en', label: 'EN' },
                    { code: 'zh-Hant', label: 'ZH' },
                    { code: 'ja', label: 'JP' }
                  ]
                    .filter((lang) => {
                      const currentLang = i18n.language === 'zh' ? 'zh-Hant' : i18n.language;
                      return lang.code !== currentLang;
                    })
                    .map((lang) => (
                    <div
                      key={lang.code}
                      className="lang-dropdown__item"
                      onClick={() => handleLanguageChange(lang.code)}
                      onMouseEnter={() => { playMenuHoverSound(); }}
                    >
                      <PixelText2D
                        text={lang.label}
                        textEnabled
                        pixelSize={1}
                        letterSpacing={0}
                        width={40}
                        height={24}
                        animated={false}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>
      
      <main className="home__main">
        <section className="home__hero" aria-labelledby="about-hero-title">
          <h1 id="about-hero-title" className="home__hero-title">
            HI..I’M HARRY!
          </h1>
          <p className="home__hero-subtitle">PRODUCT DESIGN</p>
          <p className="home__hero-description">
            <span className="home__hero-description-intro">
              ISN’T ABOUT CRAFTING DAZZLING VISUALS OR BUILDING CUTTING-EDGE TECH.
            </span>
            <br />
            IT’S ABOUT APPLYING INSIGHT AND ANALYSIS TO REACH THE RIGHT USERS
            <br />
            AND TRULY SOLVE THEIR PROBLEMS.
          </p>
        </section>
      </main>
    </div>
  );
};

export default About;


