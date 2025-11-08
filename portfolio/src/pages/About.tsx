import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo, PixelText2D, HarryRotation } from 'hds';
import { audioManager, type PlaybackHandle } from '../../../harryds/src/utils/audioManager';
import { useTheme } from '../theme/useTheme';
import hoverSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep.mp3';
import clickSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep 3.mp3';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import award01 from '../../assets/imgs/awards/award-01.png';
import award02 from '../../assets/imgs/awards/award-02.png';
import award03 from '../../assets/imgs/awards/award-03.png';
import award04 from '../../assets/imgs/awards/award-04.png';
import logoAwwrated from '../../assets/imgs/logos/logo-awwrated-dark.png';
import logoKkday from '../../assets/imgs/logos/logo-kkday-dark.png';
import logoNownews from '../../assets/imgs/logos/logo-nownews-dark.png';
import logoWalkerland from '../../assets/imgs/logos/logo-walkerland-dark.png';
import logoIxda from '../../assets/imgs/logos/logo-ixda-dark.png';
import logoAapd from '../../assets/imgs/logos/logo-aapd-dark.png';
import logoQnap from '../../assets/imgs/logos/logo-qnap-dark.png';
import logoUxy from '../../assets/imgs/logos/logo-uxy-dark.png';
import logoShopmatic from '../../assets/imgs/logos/logo-shopmatic-dark.png';
import '../pages/Home.scss';

const About: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const menuHoverHandleRef = useRef<PlaybackHandle | null>(null);
  const menuClickHandleRef = useRef<PlaybackHandle | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubtitleRef = useRef<HTMLParagraphElement>(null);
  const heroDescriptionRef = useRef<HTMLParagraphElement>(null);
  const introSectionRef = useRef<HTMLElement>(null);
  const introPrimaryColumnRef = useRef<HTMLDivElement>(null);
  const introVisualRef = useRef<HTMLDivElement>(null);
  const awardsSectionRef = useRef<HTMLElement>(null);
  const clientsSectionRef = useRef<HTMLElement>(null);
  const backgroundSectionRef = useRef<HTMLElement>(null);

  // HarryRotation frame state
  const [rotationFrame, setRotationFrame] = useState(1);

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

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    if (!scrollContainerRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const updateIntroVisualPosition = () => {
      if (!introSectionRef.current || !introVisualRef.current) return;
      const introOffsetTop = introSectionRef.current.offsetTop;
      const offset5vh = window.innerHeight * 0.15;
      introVisualRef.current.style.top = `${introOffsetTop - offset5vh}px`;
    };

    updateIntroVisualPosition();
    ScrollTrigger.addEventListener('refreshInit', updateIntroVisualPosition);

    const ctx = gsap.context(() => {
      const heroTexts = [heroTitleRef.current, heroSubtitleRef.current, heroDescriptionRef.current].filter(Boolean);

      const timeline = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: {
          scrub: 1.5,
          trigger: scrollContainerRef.current,
          start: 'top 90%',
          end: 'bottom 20%',
        },
      });

      if (heroSectionRef.current) {
        timeline.from(heroSectionRef.current, { opacity: 0, yPercent: 10, duration: 0.8 });
      }

      if (heroTexts.length) {
        timeline.from(heroTexts, { opacity: 0, yPercent: 30, duration: 0.8, stagger: 0.1 }, '<');
      }

      if (introSectionRef.current || introVisualRef.current) {
        timeline.addLabel('introEnter');

        if (introSectionRef.current) {
          timeline.from(
            introSectionRef.current,
            { opacity: 0, yPercent: 45, duration: 0.9 },
            '-=0.2'
          );
        }

        if (introVisualRef.current) {
          timeline.from(
            introVisualRef.current,
            { opacity: 0, yPercent: 0, duration: 0.9 },
            '<'
          );
        }

        timeline.addLabel('introParallax');

        if (introSectionRef.current) {
          timeline.to(
            introSectionRef.current,
            { yPercent: -180, duration: 1, ease: 'none' },
            'introParallax'
          );
        }

        if (introVisualRef.current) {
          timeline.to(
            introVisualRef.current,
            { yPercent: -10, duration: 3.5, ease: 'none' },
            'introParallax'
          );
        }

      }

      if (introPrimaryColumnRef.current && introVisualRef.current) {
        const alignTimeline = gsap.timeline({
          defaults: { ease: 'power2.inOut' },
          scrollTrigger: {
            trigger: introPrimaryColumnRef.current,
            start: 'bottom top+=100',
            end: 'bottom top-=400',
            scrub: 1.5,
          },
        });

        const frameProxy = { frame: 1 };
        alignTimeline.to(introVisualRef.current, { left: '-50vw', duration: 1.5, ease: 'power3.inOut' }, 0);
        alignTimeline.to(frameProxy, { 
          frame: 9, 
          duration: 1.5, 
          ease: 'steps(7)',
          onUpdate: () => {
            setRotationFrame(Math.round(frameProxy.frame));
          }
        }, 0);
        
        alignTimeline.to({}, { duration: 0.3 });

        if (awardsSectionRef.current) {
          alignTimeline.from(
            awardsSectionRef.current,
            { yPercent: 50, duration: 1.5, ease: 'power1.out' }
          );
        }

        if (clientsSectionRef.current) {
          alignTimeline.from(
            clientsSectionRef.current,
            { yPercent: 50, duration: 1.5, ease: 'power1.out' },
            '<0.2'
          );
        }
      }

      if (backgroundSectionRef.current) {
        timeline.from(backgroundSectionRef.current, { opacity: 0, yPercent: 20, duration: 0.8 }, '-=0.1');
      }
    }, scrollContainerRef);

    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.removeEventListener('refreshInit', updateIntroVisualPosition);
      ctx.revert();
    };
  }, [i18n.language]);

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
    <div className="home scroll-trigger-ready__worm-wrap" ref={scrollContainerRef}>
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
        <section className="home__hero" aria-labelledby="about-hero-title" ref={heroSectionRef}>
          <h1 id="about-hero-title" className="home__hero-title" ref={heroTitleRef}>
            HI..I’M HARRY!
          </h1>
          <p className="home__hero-subtitle" ref={heroSubtitleRef}>PRODUCT DESIGN</p>
          <p className="home__hero-description" ref={heroDescriptionRef}>
            <span className="home__hero-description-intro">
              ISN’T ABOUT CRAFTING DAZZLING VISUALS OR BUILDING CUTTING-EDGE TECH.
            </span>
            <br />
            IT’S ABOUT APPLYING INSIGHT AND ANALYSIS TO REACH THE RIGHT USERS
            <br />
            AND TRULY SOLVE THEIR PROBLEMS.
          </p>
        </section>

        <div className="home__intro-visual" aria-hidden="true" ref={introVisualRef}>
          <HarryRotation
            width={2000}
            autoPlay={false}
            className="home__intro-rotation"
            frame={rotationFrame}
          />
        </div>

        <section className="home__intro" aria-labelledby="about-intro-title" ref={introSectionRef}>
          <div className="home__intro-grid">
            <div
              className="home__intro-column home__intro-column--primary"
              ref={introPrimaryColumnRef}
            >
              <h2 id="about-intro-title" className="home__intro-title feed-detail-overlay__section-title">
                Who AM I?<span className="feed-detail-overlay__cursor">_</span>
              </h2>
              <div className="home__intro-body">
                <p>
                  I’m Harry, with nearly 15 years’ experience in Product Design and Front-end Development.
                </p>
                <p>
                  I work as a Product designer and Front-end engineer, and I’m also a Design Systems course instructor at AAPD — using Design System to build processes and component libraries that help design and engineering collaborate efficiently, shorten time-to-market, and accelerate validation.
                </p>
                <p>
                  I also founded and have operated awwrated, a streaming information platform, for 6 years — growing the user base by 300% and page views by 800%.
                </p>
              </div>
            </div>
            <div className="home__intro-column home__intro-column--secondary" aria-hidden="true" />
          </div>
        </section>

        <section className="home__awards" aria-labelledby="about-awards-title" ref={awardsSectionRef}>
          <div className="home__intro-grid">
            <div className="home__intro-column home__intro-column--secondary" aria-hidden="true" />
            <div className="home__intro-column home__intro-column--primary">
              <h2 id="about-awards-title" className="home__intro-title feed-detail-overlay__section-title">
                Awards<span className="feed-detail-overlay__cursor">_</span>
              </h2>
              <div className="home__intro-body">
                <p>
                  I have participated in multiple Website and Product designs and have received the following international awards for recognition.
                </p>
              </div>
              <ul className="home__intro-awards">
                <li>
                  <img src={award01} alt="Awwwards Logo" className="home__intro-award-image home__intro-award-image--01" />
                  <span className="home__intro-awards-label">Awwwards</span>
                  <span className="home__intro-awards-detail">Honorable Mention, Jul 14, 2017</span>
                </li>
                <li>
                  <img src={award02} alt="App Store Badge" className="home__intro-award-image home__intro-award-image--02" />
                  <span className="home__intro-awards-label">APP STORE</span>
                  <span className="home__intro-awards-detail">Editor’s Choice, 2017</span>
                </li>
                <li>
                  <img src={award03} alt="CSS Design Awards Logo" className="home__intro-award-image home__intro-award-image--03" />
                  <span className="home__intro-awards-label">CSS DesignAwards</span>
                  <span className="home__intro-awards-detail">Website of the Day, Jan 17, 2013</span>
                </li>
                <li>
                  <img src={award04} alt="iHackGroup Award Logo" className="home__intro-award-image home__intro-award-image--04" />
                  <span className="home__intro-awards-label">iHackGroup</span>
                  <span className="home__intro-awards-detail">Best User Experience Award, 2016</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="home__clients" aria-labelledby="about-clients-title" ref={clientsSectionRef}>
          <div className="home__intro-grid">
            <div className="home__intro-column home__intro-column--secondary" aria-hidden="true" />
            <div className="home__intro-column home__intro-column--primary">
              <h2 id="about-clients-title" className="home__intro-title feed-detail-overlay__section-title">
                Clients &amp; Partners<span className="feed-detail-overlay__cursor">_</span>
              </h2>
              <div className="home__intro-body">
                <p>
                  Serving startups and enterprises alike:<br />
                  Product Design / Web Design /<br />
                  Design System Training &amp; Consulting.
                </p>
                <p>
                  A Systems-driven approach that helps teams ship faster and improve consistency.
                </p>
              </div>
              <div className="home__clients-logos">
                <img src={logoAwwrated} alt="awwrated logo" className="home__clients-logo home__clients-logo--awwrated" />
                <img src={logoKkday} alt="kkday logo" className="home__clients-logo home__clients-logo--kkday" />
                <img src={logoNownews} alt="NOWnews logo" className="home__clients-logo home__clients-logo--nownews" />
                <img src={logoWalkerland} alt="Walkerland logo" className="home__clients-logo home__clients-logo--walkerland" />
                <img src={logoIxda} alt="IXDA logo" className="home__clients-logo home__clients-logo--ixda" />
                <img src={logoAapd} alt="AAPD logo" className="home__clients-logo home__clients-logo--aapd" />
                <img src={logoQnap} alt="QNAP logo" className="home__clients-logo home__clients-logo--qnap" />
                <img src={logoUxy} alt="UXY logo" className="home__clients-logo home__clients-logo--uxy" />
                <img src={logoShopmatic} alt="Shopmatic logo" className="home__clients-logo home__clients-logo--shopmatic" />
              </div>
            </div>
          </div>
        </section>

        <section className="home__background" aria-labelledby="about-background-title" ref={backgroundSectionRef}>
          <div className="home__background-inner">
            <h2 id="about-background-title" className="home__background-title feed-detail-overlay__section-title">
              My design background<span className="feed-detail-overlay__cursor">_</span>
            </h2>
            <p className="home__background-description">
              My design inspiration didn’t come from textbooks,<br />
              but from the startup sound of the Famicom (NES).<br />
              Japanese culture of the 1980s, 8-bit pixels, tokusatsu, and anime taught me to tell stories with images. I once aimed to become a manga artist or game illustrator~<br />
              Now I turn that obsession into a design methodology,<br />
              building products that are more loved and more usable.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;


