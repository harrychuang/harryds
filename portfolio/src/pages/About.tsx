import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo, PixelText2D, HarryRotation } from 'hds';
import { audioManager, type PlaybackHandle } from '../../../harryds/src/utils/audioManager';
import { useTheme } from '../theme/useTheme';
import { gsap } from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import hoverSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep.mp3';
import clickSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep 3.mp3';
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
import Header from '../components/Header';

const About: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const menuHoverHandleRef = useRef<PlaybackHandle | null>(null);
  const menuClickHandleRef = useRef<PlaybackHandle | null>(null);
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

  // Hero 進場動畫：Title 打字效果 + 0.3s 後內文行動效
  useLayoutEffect(() => {
    if (!heroSectionRef.current || !heroTitleRef.current) return;
    gsap.registerPlugin(TextPlugin);

    const ctx = gsap.context(() => {
      const titleEl = heroTitleRef.current!;
      const fullText = (titleEl.textContent || '').trim();

      // 打字機：先清空文字，再以 TextPlugin 輸入
      gsap.set(titleEl, { text: '' });
      const tl = gsap.timeline();
      tl.to(titleEl, {
        duration: Math.max(0.8, fullText.length * 0.06),
        text: fullText,
        ease: 'none'
      });

      // 行動效：準備並進場（延遲 0.3s）
      const lineChildren = heroSectionRef.current!.querySelectorAll<HTMLElement>('.lineChild');
      if (lineChildren.length) {
        gsap.set(lineChildren, { yPercent: 100 });
        tl.to(
          lineChildren,
          {
            yPercent: 0,
            duration: 0.75,
            stagger: 0.15,
            ease: 'power3.out'
          },
          '+=0.3'
        );
      }
    }, heroSectionRef);

    return () => ctx.revert();
  }, [i18n.language]);

  // STEP 1 & 2: 視差效果與 pin 動畫
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    
    gsap.registerPlugin(ScrollTrigger);

    // 初始化視覺元素位置
    if (!introSectionRef.current || !introVisualRef.current) return;
    
    // 設置初始 top 位置
    const initialTop = introSectionRef.current.offsetTop;
    gsap.set(introVisualRef.current, { top: initialTop });

    // STEP 1: home__intro-visual 和 home__intro 一起以 1 倍速移動
    const visualElement = introVisualRef.current;
    
    // 1 倍速不需要視差動畫，元素會自然跟著頁面滾動

    // STEP 2: 當到達 10% 時 pin 住，直到 awards 頂部到達 50% 時取消 pin
    if (awardsSectionRef.current) {
      ScrollTrigger.create({
        trigger: visualElement,
        start: 'top 10%',
        endTrigger: awardsSectionRef.current,
        end: 'top 50%',
        pin: true,
        pinSpacing: false,
        markers: true // 開發時顯示標記，完成後可移除
      });
    }

    // STEP 3: 當 home__intro 底部離開後，移到左邊 -50vw，同時向上移動 100px
    // 同時將寬度從 2000px 改為 1950px，rotationFrame 從 1 變化到 8
    const rotationElement = visualElement.querySelector('.home__intro-rotation') as HTMLElement;
    
    gsap.to(visualElement, {
      x: '-51vw',
      y: '-=0',  // 向上移動 200px
      scrollTrigger: {
        trigger: introSectionRef.current,
        start: 'bottom 10%',
        end: '+=500',  // 從 start 位置再滾動 10%
        scrub: true,
        markers: true, // 開發時顯示標記，完成後可移除
        onUpdate: (self) => {
          // 根據進度計算當前幀數 (1 到 8)
          const progress = self.progress;
          const currentFrame = Math.round(1 + progress * 6); // 1 + (0~1) * 7 = 1~8
          setRotationFrame(currentFrame);
        }
      }
    });
    
    // 同時改變 HarryRotation 的寬度
    if (rotationElement) {
      gsap.to(rotationElement, {
        width: '2000px',
        scrollTrigger: {
          trigger: introSectionRef.current,
          start: 'bottom 10%',
          end: '+=10%',
          scrub: true,
          markers: true
        }
      });
    }

    // STEP 4: 當 awards 頂部到達 50% 時，取消 pin，以 1.2 速度向上移動
    // 使用 timeline 來確保 y 軸動畫的連續性
    if (awardsSectionRef.current && clientsSectionRef.current) {
      // 計算視窗高度的 50% 位置到 clients 底部的滾動距離
      const awardsToClientsHeight = clientsSectionRef.current.offsetTop + 
                                    clientsSectionRef.current.offsetHeight - 
                                    awardsSectionRef.current.offsetTop;
      
      // 以 1.7 速度移動，表示視差距離 = 滾動距離 * -0.7
      const step4ParallaxDistance = awardsToClientsHeight * -0.7;
      
      // 創建一個從當前位置繼續的動畫
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: awardsSectionRef.current,
          start: 'top 50%',
          endTrigger: clientsSectionRef.current,
          end: 'bottom bottom',
          scrub: true,
          markers: true // 開發時顯示標記，完成後可移除
        }
      });
      
      // 從當前 y 值繼續向上移動（負值表示加快向上速度）
      tl.to(visualElement, {
        y: `+=${step4ParallaxDistance}`,
        ease: 'none'
      });
    }

    // 監聽視窗大小變化並刷新
    const handleResize = () => {
      ScrollTrigger.refresh();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      ScrollTrigger.getAll().forEach(st => st.kill());
      setRotationFrame(1); // 重置為初始幀
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
    <div className="home">
      <Header
        onLogoClick={() => navigate('/')}
        logoType="default"
        logoAnimated={true}
        hideNav={false}
        menuItems={['home', 'works', 'article', 'about']}
        t={t}
        getMenuItemAnimated={(key) => !!menuAnimStates[key]}
        onMenuItemHover={(key) => { triggerMenuHoverOnce(key); playMenuHoverSound(); }}
        onMenuItemClick={(key) => { 
          playMenuClickSound();
          if (key === 'home') {
            navigate('/');
          } else if (key === 'about') {
            navigate('/about');
          }
        }}
        showThemeToggle={true}
        theme={theme}
        onToggleTheme={() => { playMenuClickSound(); toggleTheme(); }}
        onThemeHover={() => { playMenuHoverSound(); }}
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
          const currentLang = i18n.language === 'zh' ? 'zh-Hant' : i18n.language;
          return lang.code !== currentLang;
        })}
        onLanguageChange={handleLanguageChange}
        onLanguageHover={() => { playMenuHoverSound(); }}
      />
      
      <main className="home__main">
        <section className="home__hero" aria-labelledby="about-hero-title" ref={heroSectionRef}>
          <h1 id="about-hero-title" className="home__hero-title" ref={heroTitleRef}>
            HI..I’M HARRY!
          </h1>
          <p className="home__hero-subtitle" ref={heroSubtitleRef}>
            <span className="lineParent">
              <span className="lineChild">PRODUCT DESIGN</span>
            </span>
          </p>
          <p className="home__hero-description" ref={heroDescriptionRef}>
            <span className="lineParent">
              <span className="lineChild">
                <span className="home__hero-description-intro">
                  ISN’T ABOUT CRAFTING DAZZLING VISUALS OR BUILDING CUTTING-EDGE TECH.
                </span>
              </span>
            </span>
            <span className="lineParent">
              <span className="lineChild">
                IT’S ABOUT APPLYING INSIGHT AND ANALYSIS TO REACH THE RIGHT USERS
              </span>
            </span>
            <span className="lineParent">
              <span className="lineChild">AND TRULY SOLVE THEIR PROBLEMS.</span>
            </span>
          </p>
        </section>

        <div className="home__intro-visual" aria-hidden="true" ref={introVisualRef}>
          <HarryRotation
            width={'2000px'}
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


