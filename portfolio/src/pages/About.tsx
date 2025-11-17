import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo, PixelText2D, HarryAnimation, ListCard, ParticlesBackground } from 'hds';
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
import referrerKris from '../../assets/imgs/referrers/referrer-kris.jpg';
import referrerDarwin from '../../assets/imgs/referrers/referrer-darwin.jpg';
import referrerFreddie from '../../assets/imgs/referrers/referrer-freddie.jpg';
import referrerThenn from '../../assets/imgs/referrers/referrer-thenn.jpg';
import referrerSimon from '../../assets/imgs/referrers/referrer-simon.jpg';
import referrerSherry from '../../assets/imgs/referrers/referrer-sherry.jpg';
import './About.scss';
import '../pages/Home.scss';
import Header from '../components/Header';
import { GIPHY_URLS } from '../constants/giphy';

const About: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['common', 'about']);
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
  const backgroundRotationRef = useRef<HTMLDivElement>(null);
  const referrerSectionRef = useRef<HTMLElement>(null);
  const servicesContactSectionRef = useRef<HTMLElement>(null);
  const servicesTitleRef = useRef<HTMLHeadingElement>(null);
  const contactTitleRef = useRef<HTMLHeadingElement>(null);
  const contactAnimationRef = useRef<HTMLDivElement>(null);

  // Referrer 資料 - 從 i18n 讀取
  const referrerImages = [
    referrerKris,
    referrerDarwin,
    referrerFreddie,
    referrerThenn,
    referrerSimon,
    referrerSherry
  ];
  
  const referrerData = t('referrer.items', { returnObjects: true, ns: 'about' }) as Array<{
    title: string;
    name: string;
    testimonial: string;
  }>;
  
  const referrerDataWithImages = referrerData.map((item, index) => ({
    ...item,
    imageSrc: referrerImages[index]
  }));

  // HarryAnimation frame state
  const [rotationFrame, setRotationFrame] = useState(1);
  const [isPageReady, setIsPageReady] = useState(false);
  
  // Email copy tooltip state
  const [showEmailTooltip, setShowEmailTooltip] = useState(false);
  const emailRef = useRef<HTMLAnchorElement>(null);

  // Giphy marquee state
  interface GiphyItem {
    id: string;
    url: string;
  }
  const [giphyItems, setGiphyItems] = useState<GiphyItem[]>([]);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const itemPositionsRef = useRef<Map<string, number>>(new Map());
  
  // 追蹤已使用的 Giphy URL（不重複隨機選擇）
  const usedGiphyUrlsRef = useRef<Set<string>>(new Set());

  // 獲取不重複的隨機 Giphy URL
  const getRandomGiphyUrl = useCallback(() => {
    const usedUrls = usedGiphyUrlsRef.current;
    
    // 如果所有 URL 都已使用，重置追蹤
    if (usedUrls.size >= GIPHY_URLS.length) {
      usedUrls.clear();
    }
    
    // 獲取未使用的 URL
    const availableUrls = GIPHY_URLS.filter(url => !usedUrls.has(url));
    
    // 從未使用的 URL 中隨機選擇
    const randomIndex = Math.floor(Math.random() * availableUrls.length);
    const selectedUrl = availableUrls[randomIndex];
    
    // 標記為已使用
    usedUrls.add(selectedUrl);
    
    return selectedUrl;
  }, []);

  // 初始化 giphy 項目
  useEffect(() => {

    // 計算初始需要的圖片數量（基於視窗寬度）
    const itemWidth = 300; // 圖片寬度
    const gap = 100; // 間距
    const totalItemWidth = itemWidth + gap;
    const initialCount = Math.ceil(window.innerWidth / totalItemWidth) + 2; // 多加2個確保無縫

    const initialItems: GiphyItem[] = [];
    for (let i = 0; i < initialCount; i++) {
      initialItems.push({
        id: `giphy-${Date.now()}-${i}`,
        url: getRandomGiphyUrl(),
      });
    }

    setGiphyItems(initialItems);

    // 初始化位置
    const positions = new Map<string, number>();
    initialItems.forEach((item, index) => {
      positions.set(item.id, index * totalItemWidth);
    });
    itemPositionsRef.current = positions;
  }, [getRandomGiphyUrl]);

  // 跑馬燈動畫
  useEffect(() => {
    if (giphyItems.length === 0) return;

    const itemWidth = 300;
    const gap = 100;
    const totalItemWidth = itemWidth + gap;
    const speed = 1; // 每幀移動的像素數

    const animate = () => {
      const positions = itemPositionsRef.current;
      let needsUpdate = false;
      const itemsToRemove: string[] = [];
      const newItems: GiphyItem[] = [];

      // 更新每個項目的位置
      giphyItems.forEach((item) => {
        const currentPos = positions.get(item.id) ?? 0;
        const newPos = currentPos - speed;

        // 如果項目完全移出左側，標記為移除
        if (newPos < -(itemWidth + gap)) {
          itemsToRemove.push(item.id);
          needsUpdate = true;
        } else {
          positions.set(item.id, newPos);
        }
      });

      // 移除離開畫面的項目並添加新項目
      if (itemsToRemove.length > 0) {
        // 找到最右邊的項目位置
        let maxPos = -Infinity;
        positions.forEach((pos) => {
          if (pos > maxPos) maxPos = pos;
        });

        // 為每個移除的項目添加一個新項目
        itemsToRemove.forEach(() => {
          const newItem: GiphyItem = {
            id: `giphy-${Date.now()}-${Math.random()}`,
            url: getRandomGiphyUrl(),
          };
          newItems.push(newItem);
          positions.set(newItem.id, maxPos + totalItemWidth);
          maxPos += totalItemWidth;
        });

        // 移除舊項目的位置記錄
        itemsToRemove.forEach((id) => {
          positions.delete(id);
        });
      }

      // 更新 DOM
      if (marqueeRef.current) {
        marqueeRef.current.childNodes.forEach((node, index) => {
          const item = giphyItems[index];
          if (item && node instanceof HTMLElement) {
            const pos = positions.get(item.id) ?? 0;
            node.style.transform = `translateX(${pos}px)`;
          }
        });
      }

      // 更新狀態
      if (needsUpdate) {
        setGiphyItems((prev) => {
          const filtered = prev.filter((item) => !itemsToRemove.includes(item.id));
          return [...filtered, ...newItems];
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [giphyItems, getRandomGiphyUrl]);

  // 頁面 / 圖片載入完成後刷新 ScrollTrigger，避免重新整理時位置錯亂
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const refreshScrollTrigger = () => {
      ScrollTrigger.refresh();
    };

    window.addEventListener('load', refreshScrollTrigger);
    const refreshTimer = setTimeout(refreshScrollTrigger, 300);

    return () => {
      window.removeEventListener('load', refreshScrollTrigger);
      clearTimeout(refreshTimer);
    };
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

  // 複製 Email 到剪貼簿
  const handleCopyEmail = useCallback(async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); // 防止打開 mailto
    
    const email = 'harrychuang23@gmail.com';
    
    try {
      await navigator.clipboard.writeText(email);
      setShowEmailTooltip(true);
      playMenuClickSound();
      
      // 3 秒後隱藏 tooltip
      setTimeout(() => {
        setShowEmailTooltip(false);
      }, 3000);
    } catch (err) {
      console.warn('Failed to copy email:', err);
    }
  }, [playMenuClickSound]);

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

  // 立即設置 introVisualRef 的初始位置（在渲染前）
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    if (!introSectionRef.current || !introVisualRef.current) return;
    
    // 立即設置初始位置，避免閃爍
    const initialTop = introSectionRef.current.offsetTop;
    gsap.set(introVisualRef.current, { 
      top: initialTop,
      opacity: 1  // 確保可見
    });
  }, []); // 空依賴陣列，只在首次掛載時執行

  // STEP 1 & 2: 視差效果與 pin 動畫
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (document.readyState === 'complete') {
      setIsPageReady(true);
      return;
    }

    const handleLoad = () => setIsPageReady(true);
    window.addEventListener('load', handleLoad);

    return () => window.removeEventListener('load', handleLoad);
  }, []);

  useLayoutEffect(() => {
    if (typeof window === 'undefined' || !isPageReady) return;
    
    gsap.registerPlugin(ScrollTrigger);

    // 初始化視覺元素位置（頁面載入完成後重新計算）
    if (!introSectionRef.current || !introVisualRef.current) return;
    
    // 重新設置 top 位置（確保圖片載入後位置正確）
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
        pinSpacing: false
      });
    }

    // STEP 3: 當 home__intro 底部離開後，移到左邊 -50vw，同時向上移動 100px
    // 同時將寬度從 2000px 改為 1950px，rotationFrame 從 1 變化到 8
    const rotationElement = visualElement.querySelector('.home__intro-rotation') as HTMLElement;
    
    gsap.to(visualElement, {
      x: '-48vw',
      y: '-=0',  // 向上移動 200px
      scrollTrigger: {
        trigger: introSectionRef.current,
        start: 'bottom 50%',
        scrub: true,
        onUpdate: (self) => {
          // 根據進度計算當前幀數 (1 到 8)
          const progress = self.progress;
          const currentFrame = Math.round(1 + progress * 7); // 1 + (0~1) * 7 = 1~8
          setRotationFrame(currentFrame);
        }
      }
    });
    
    // 同時改變 HarryAnimation 的寬度
    if (rotationElement) {
      gsap.to(rotationElement, {
        width: '1900px',
        scrollTrigger: {
          trigger: introSectionRef.current,
          start: 'bottom 50%',
          scrub: true
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
      
      // 以 0.2 速度移動，表示視差距離 = 滾動距離 * 0.2
      const step4ParallaxDistance = awardsToClientsHeight * 0.05;
      
      // 創建一個從當前位置繼續的動畫
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: awardsSectionRef.current,
          start: 'top 50%',
          endTrigger: clientsSectionRef.current,
          end: 'bottom bottom',
          scrub: true
        }
      });
      
      // 從當前 y 值繼續向上移動（負值表示加快向上速度）
      tl.to(visualElement, {
        y: `+=${step4ParallaxDistance}`,
        ease: 'none'
      });
    }

    // STEP 5: 當 background section 頂部到達 30% 時，HarryAnimation 從上方移動到當前位置
    if (backgroundSectionRef.current && backgroundRotationRef.current) {
      // 設置初始狀態：隱藏且位置在畫面上方
      gsap.set(backgroundRotationRef.current, { 
        y: '20vh',
        transform: 'scale(1)',
        autoAlpha: 0  // autoAlpha 同時控制 opacity 和 visibility
      });
      
      // 創建從上方移動到當前位置的動畫，同時顯示元素
      gsap.to(backgroundRotationRef.current, {
        y: 0,
        autoAlpha: 1,  // 動畫時變為可見
        transform: 'scale(1)',
        ease: 'expo.inOut',
        scrollTrigger: {
          trigger: backgroundSectionRef.current,
          start: 'start 90%',
          end: 'top 10%',
          scrub: 1.5  // 使用數值而非 true 以保留 ease 效果
        }
      });
    }

    // STEP 5.5: 當 background section 到達頂部 25% 時，pin 住整個 section，滾動 400px 後解除
    if (backgroundSectionRef.current) {
      ScrollTrigger.create({
        trigger: backgroundSectionRef.current,
        start: 'top 15%',
        end: '+=800',  // 從 start 位置再滾動 800px
        pin: true,
        pinSpacing: true,
        id: 'background-pin'
      });
    }

    // STEP 6: 當 background section 到達 start 70% 時，giphy 跑馬燈淡入
    if (backgroundSectionRef.current && marqueeRef.current) {
      // 設置初始狀態：完全透明
      gsap.set(marqueeRef.current, { 
        transform: 'scale(1) translateY(100%) translateX(500%)'
      });
      
      // 創建淡入動畫
      gsap.to(marqueeRef.current, {
        ease: 'power1.out',
        transform: 'scale(1) translateY(-50%) translateX(0%)',
        scrollTrigger: {
          trigger: backgroundSectionRef.current,
          start: 'start 40%',
          end: 'start 80%',
          scrub: 2.5
        }
      });
    }

    // STEP 7: 當 referrer section 頂部到達 15% 時，不 pin section，讓內容自然滾動
    // 改為只 pin 個別的 ListCard
    if (referrerSectionRef.current) {
      // STEP 7.1: 為每個 ListCard 設置 pin、z-index 和 fadeout 效果
      const listCards = referrerSectionRef.current.querySelectorAll('.home__referrer-card');
      
      listCards.forEach((card, index) => {
        const htmlCard = card as HTMLElement;
        
        // 設置初始 z-index 和 3D 屬性
        gsap.set(htmlCard, { 
          zIndex: listCards.length - index,  // 後面的卡片 z-index 較高
          transformPerspective: 1000,
          transformStyle: 'preserve-3d'
        });

        // 當卡片頂部到達 20% 時，pin 住該卡片，並在滾動過程中淡出
        ScrollTrigger.create({
          trigger: htmlCard,
          start: 'top 25%',      // 卡片頂部到達 20% 時 pin 住
          end: '+=250',          // pin 住並滾動 200px 後解除
          pinSpacing: false,
          pinType: 'transform',  // 使用 transform 而非 fixed positioning
          id: `referrer-card-pin-${index}`,
          // 在 pin 期間同時執行淡出動畫
          onUpdate: (self) => {
            // 根據 pin 的進度來調整透明度
            gsap.to(htmlCard, {
              opacity: 1 - self.progress,  // 從 1 漸變到 0
              top: - self.progress*100,
              zIndex: Math.round((listCards.length - index) * (1 - self.progress)),
              duration: 0.3,
              overwrite: true,
              ease: 'power2.out'
            });
          }
        });
      });
    }

    // 監聽視窗大小變化並刷新（使用 debounce 優化性能）
    let resizeTimer: number | null = null;
    const handleResize = () => {
      // Debounce: 等待 resize 結束後再處理
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      
      resizeTimer = window.setTimeout(() => {
        if (!introSectionRef.current || !introVisualRef.current) return;
        
        const visualElement = introVisualRef.current;
        
        // 儲存當前滾動位置
        const currentScrollY = window.scrollY;
        
        // 1. 清除所有 GSAP 設置的內聯樣式（包括 transform 和 pin 樣式）
        gsap.set(visualElement, { 
          clearProps: 'all'
        });
        
        // 2. 重新設置初始狀態
        const newTop = introSectionRef.current.offsetTop;
        gsap.set(visualElement, { 
          top: newTop,
          opacity: 1,
          left: '0vw',
          x: 0,
          y: 0
        });
        
        // 3. 刷新所有 ScrollTrigger，它們會根據當前滾動位置重新計算
        ScrollTrigger.refresh();
        
        // 4. 確保滾動位置不變
        window.scrollTo(0, currentScrollY);
      }, 100); // 100ms debounce
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      ScrollTrigger.getAll().forEach(st => st.kill());
      setRotationFrame(1); // 重置為初始幀
    };
  }, [i18n.language, isPageReady]);

  // Services & Contact 進場動畫：當區塊頂部到達 30% 時觸發
  useLayoutEffect(() => {
    if (typeof window === 'undefined' || !isPageReady) return;
    if (!servicesContactSectionRef.current || !servicesTitleRef.current || !contactTitleRef.current) return;
    
    gsap.registerPlugin(TextPlugin, ScrollTrigger);

    const ctx = gsap.context(() => {
      const sectionEl = servicesContactSectionRef.current!;
      const servicesTitleEl = servicesTitleRef.current!;
      const contactTitleEl = contactTitleRef.current!;

      // 獲取標題文字元素（不包含 cursor）
      const servicesTextEl = servicesTitleEl.querySelector('.title-text');
      const contactTextEl = contactTitleEl.querySelector('.title-text');

      if (!servicesTextEl || !contactTextEl) return;

      // 獲取完整文字（從翻譯取得）
      const servicesFullText = t('services.title', { ns: 'about' });
      const contactFullText = t('contact.title', { ns: 'about' });

      // 準備：清空標題文字，隱藏所有 lineChildren
      gsap.set(servicesTextEl, { text: '' });
      gsap.set(contactTextEl, { text: '' });
      
      // 分別獲取 Services 和 Contact 的內容元素
      const servicesColumn = servicesTitleEl.closest('.home__services-contact-column');
      const contactColumn = contactTitleEl.closest('.home__services-contact-column');
      
      const servicesChildren = servicesColumn?.querySelectorAll<HTMLElement>('.lineChild') || [];
      const contactChildren = contactColumn?.querySelectorAll<HTMLElement>('.lineChild') || [];
      
      gsap.set([...servicesChildren, ...contactChildren], { yPercent: 100 });

      // 創建 ScrollTrigger 時間軸
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionEl,
          start: 'top 40%',
          toggleActions: 'play none none none'
        }
      });

      // STEP 1: Services 標題打字機效果
      tl.to(servicesTextEl, {
        duration: Math.max(0.3, servicesFullText.length * 0.06),
        text: servicesFullText,
        ease: 'none'
      });

      // STEP 2: Services 內容行動效（延遲 0.2s）
      tl.to(
        servicesChildren,
        {
          yPercent: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power3.out'
        },
        '0'
      );

      // STEP 3: Contact 標題打字機效果（延遲 0.3s）
      tl.to(
        contactTextEl,
        {
          duration: Math.max(0.3, contactFullText.length * 0.06),
          text: contactFullText,
          ease: 'none'
        },
        '+=0'
      );

      // STEP 4: Contact 內容行動效（延遲 0.2s）
      tl.to(
        contactChildren,
        {
          yPercent: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power3.out'
        },
        '+=0'
      );
    }, servicesContactSectionRef);

    // STEP 5: usemac 動畫 - 當 contact 區塊頂部到達 50% 時從右側進入
    if (contactTitleRef.current && contactAnimationRef.current) {
      // 設置初始狀態：從右側外面開始
      gsap.set(contactAnimationRef.current, { 
        x: 300,  // 從右側 300px 外開始
        opacity: 0
      });
      
      // 創建進場動畫
      gsap.to(contactAnimationRef.current, {
        x: 0,  // 移動到原位置
        opacity: 1,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: contactTitleRef.current,
          start: 'top 50%',  // 當 contact 區塊頂部到達 50% 時
          toggleActions: 'play none none none'
        }
      });
    }

    return () => ctx.revert();
  }, [i18n.language, isPageReady]);

  // Contact 連結 hover 亂數文字效果（使用 GSAP）
  useEffect(() => {
    if (typeof window === 'undefined' || !isPageReady) return;

    // 選取所有 contact 相關的連結（email, phone, social）
    const contactLinks = document.querySelectorAll('.home__contact-email, .home__contact-phone, .home__contact-social-link');
    
    // 儲存每個元素的原始文字和動畫 tween
    const linkData = new Map<HTMLElement, { originalText: string, tween: gsap.core.Tween | null }>();
    
    // 初始化：儲存每個連結的原始文字
    contactLinks.forEach((link) => {
      const element = link as HTMLElement;
      linkData.set(element, {
        originalText: element.textContent || '',
        tween: null
      });
    });
    
    const scrambleText = (element: HTMLElement, finalText: string) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-*/=<>[]{}@.';
      let scrambleObj = { progress: 0 };
      
      // 使用 GSAP 動畫來控制亂數進度
      const tween = gsap.to(scrambleObj, {
        progress: finalText.length,
        duration: 0.6,
        ease: 'none',
        onUpdate: () => {
          const progress = scrambleObj.progress;
          element.textContent = finalText
            .split('')
            .map((char, index) => {
              if (char === ' ' || char === '+' || char === '@' || char === '.') return char;
              if (index < progress) {
                return finalText[index];
              }
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('');
        },
        onComplete: () => {
          element.textContent = finalText;
          // 動畫完成後清除 tween 引用
          const data = linkData.get(element);
          if (data) {
            data.tween = null;
          }
        }
      });
      
      return tween;
    };

    const handleMouseEnter = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const data = linkData.get(target);
      
      if (!data) return;
      
      // 如果有正在進行的動畫，先 kill 掉
      if (data.tween) {
        data.tween.kill();
      }
      
      // 使用儲存的原始文字開始新動畫
      data.tween = scrambleText(target, data.originalText);
    };

    contactLinks.forEach((link) => {
      link.addEventListener('mouseenter', handleMouseEnter);
    });

    return () => {
      // 清理：移除事件監聽器並 kill 所有動畫
      contactLinks.forEach((link) => {
        link.removeEventListener('mouseenter', handleMouseEnter);
        const data = linkData.get(link as HTMLElement);
        if (data?.tween) {
          data.tween.kill();
        }
      });
      linkData.clear();
    };
  }, [isPageReady]);

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
    <div className="home" data-lang={i18n.language} data-page="about">
      {/* Canvas Particles 背景 */}
      <ParticlesBackground
        particleCount={30}
        colors={['#111111', '#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#999999']}
        sizeRange={[2, 10]}
        fixed={true}
        zIndex={0}
      />
      
      <Header
        onLogoClick={() => navigate('/')}
        logoType="default"
        logoAnimated={true}
        hideNav={false}
        menuItems={['work', 'articles', 'about']}
        activeMenuItem="about"
        t={t}
        getMenuItemAnimated={(key) => !!menuAnimStates[key]}
        onMenuItemHover={(key) => { triggerMenuHoverOnce(key); playMenuHoverSound(); }}
        onMenuItemClick={(key) => { 
          playMenuClickSound();
          if (key === 'work') {
            navigate('/');
          } else if (key === 'about') {
            navigate('/about');
          } else if (key === 'articles') {
            navigate('/articles');
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
              <span className="lineChild">{t('hero.subtitle', { ns: 'about' })}</span>
            </span>
          </p>
          <p className="home__hero-description" ref={heroDescriptionRef}>
            <span className="lineParent">
              <span className="lineChild">
                <span className="home__hero-description-intro">
                  {t('hero.descriptionIntro', { ns: 'about' })}
                </span>
              </span>
            </span>
            <span className="lineParent">
              <span className="lineChild">
                {t('hero.descriptionLine1', { ns: 'about' })}
              </span>
            </span>
            <span className="lineParent">
              <span className="lineChild">{t('hero.descriptionLine2', { ns: 'about' })}</span>
            </span>
          </p>
        </section>

        <div className="home__intro-visual" aria-hidden="true" ref={introVisualRef}>
          <HarryAnimation
            width={'2000px'}
            autoPlay={false}
            className="home__intro-rotation"
            frame={rotationFrame}
            enableParticles={true}
          />
        </div>

        <section className="home__intro" aria-labelledby="about-intro-title" ref={introSectionRef}>
          <div className="home__intro-grid">
            <div
              className="home__intro-column home__intro-column--primary"
              ref={introPrimaryColumnRef}
            >
              <h2 id="about-intro-title" className="home__intro-title feed-detail-overlay__section-title">
                {t('whoAmI.title', { ns: 'about' })}<span className="feed-detail-overlay__cursor">_</span>
              </h2>
              <div className="home__intro-body">
                <p>
                  {t('whoAmI.paragraph1', { ns: 'about' })}
                </p>
                <p>
                  {t('whoAmI.paragraph2', { ns: 'about' })}
                </p>
                <p>
                  {t('whoAmI.paragraph3', { ns: 'about' })}
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
                {t('awards.title', { ns: 'about' })}<span className="feed-detail-overlay__cursor">_</span>
              </h2>
              <div className="home__intro-body">
                <p>
                  {t('awards.description', { ns: 'about' })}
                </p>
              </div>
              <ul className="home__intro-awards">
                <li>
                  <img src={award01} alt="Awwwards Logo" className="home__intro-award-image home__intro-award-image--01" />
                  <span className="home__intro-awards-label">{t('awards.items.awwwards.label', { ns: 'about' })}</span>
                  <span className="home__intro-awards-detail">{t('awards.items.awwwards.detail', { ns: 'about' })}</span>
                </li>
                <li>
                  <img src={award02} alt="App Store Badge" className="home__intro-award-image home__intro-award-image--02" />
                  <span className="home__intro-awards-label">{t('awards.items.appStore.label', { ns: 'about' })}</span>
                  <span className="home__intro-awards-detail">{t('awards.items.appStore.detail', { ns: 'about' })}</span>
                </li>
                <li>
                  <img src={award03} alt="CSS Design Awards Logo" className="home__intro-award-image home__intro-award-image--03" />
                  <span className="home__intro-awards-label">{t('awards.items.cssDesign.label', { ns: 'about' })}</span>
                  <span className="home__intro-awards-detail">{t('awards.items.cssDesign.detail', { ns: 'about' })}</span>
                </li>
                <li>
                  <img src={award04} alt="iHackGroup Award Logo" className="home__intro-award-image home__intro-award-image--04" />
                  <span className="home__intro-awards-label">{t('awards.items.ihackGroup.label', { ns: 'about' })}</span>
                  <span className="home__intro-awards-detail">{t('awards.items.ihackGroup.detail', { ns: 'about' })}</span>
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
                {t('clients.title', { ns: 'about' })}<span className="feed-detail-overlay__cursor">_</span>
              </h2>
              <div className="home__intro-body">
                <p dangerouslySetInnerHTML={{ __html: t('clients.paragraph1', { ns: 'about' }) }} />
                <p>
                  {t('clients.paragraph2', { ns: 'about' })}
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
              {t('background.title', { ns: 'about' })}<span className="feed-detail-overlay__cursor">_</span>
            </h2>
            <p className="home__background-description">
              {t('background.line1', { ns: 'about' })}<br />
              {t('background.line2', { ns: 'about' })}<br />
              {t('background.line3', { ns: 'about' })}<br />
              {t('background.line4', { ns: 'about' })}<br />
              {t('background.line5', { ns: 'about' })}<br />
              {t('background.line6', { ns: 'about' })}
            </p>
            <div className="home__background-rotation-wrapper">
              <div className="home__background-marquee" ref={marqueeRef} aria-hidden="true">
                {giphyItems.map((item) => (
                  <div
                    key={item.id}
                    className="home__background-marquee-item"
                    style={{
                      backgroundImage: `url(${item.url})`,
                    }}
                  />
                ))}
              </div>
              <div className="home__background-rotation" ref={backgroundRotationRef}>
                <HarryAnimation
                  width={'250px'}
                  autoPlay={true}
                  enableParticles={true}
                  frameDuration={400}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="home__referrer" aria-labelledby="about-referrer-title" ref={referrerSectionRef}>
          <h2 id="about-referrer-title" className="home__intro-title feed-detail-overlay__section-title">
            {t('referrer.title', { ns: 'about' })}<span className="feed-detail-overlay__cursor">_</span>
          </h2>
          <div className="home__referrer-list">
            {referrerDataWithImages.map((referrer, index) => (
              <ListCard
                key={index}
                imageSrc={referrer.imageSrc}
                title={referrer.title}
                name={referrer.name}
                testimonial={referrer.testimonial}
                className="home__referrer-card"
              />
            ))}
          </div>
        </section>

        <section className="home__services-contact" aria-labelledby="about-services-title" ref={servicesContactSectionRef}>
          <div className="home__services-contact-grid">
            <div className="home__services-contact-column">
              <h2 id="about-services-title" className="home__intro-title feed-detail-overlay__section-title" ref={servicesTitleRef}>
                <span className="title-text">{t('services.title', { ns: 'about' })}</span><span className="feed-detail-overlay__cursor">_</span>
              </h2>
              <div className="home__services-subtitle">
                <span className="lineParent">
                  <span className="lineChild">{t('services.subtitle.line1', { ns: 'about' })}</span>
                </span>
                <span className="lineParent">
                  <span className="lineChild">{t('services.subtitle.line2', { ns: 'about' })}</span>
                </span>
                <span className="lineParent">
                  <span className="lineChild">{t('services.subtitle.line3', { ns: 'about' })}</span>
                </span>
              </div>
              <div className="home__services-list">
                <div className="home__services-category">
                  <span className="lineParent">
                    <h3 className="home__services-category-title lineChild">{t('services.categories.webApp.title', { ns: 'about' })}</h3>
                  </span>
                  <div className="home__services-items">
                    {(t('services.categories.webApp.items', { returnObjects: true, ns: 'about' }) as string[]).map((item, index) => (
                      <span key={index} className="lineParent">
                        <span className="home__services-item lineChild">{item}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="home__services-category">
                  <span className="lineParent">
                    <h3 className="home__services-category-title lineChild">{t('services.categories.development.title', { ns: 'about' })}</h3>
                  </span>
                  <div className="home__services-items">
                    {(t('services.categories.development.items', { returnObjects: true, ns: 'about' }) as string[]).map((item, index) => (
                      <span key={index} className="lineParent">
                        <span className="home__services-item lineChild">{item}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="home__services-category">
                  <span className="lineParent">
                    <h3 className="home__services-category-title lineChild">{t('services.categories.designSystem.title', { ns: 'about' })}</h3>
                  </span>
                  <div className="home__services-items">
                    {(t('services.categories.designSystem.items', { returnObjects: true, ns: 'about' }) as string[]).map((item, index) => (
                      <span key={index} className="lineParent">
                        <span className="home__services-item lineChild">{item}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="home__services-contact-column">
              <h2 id="about-contact-title" className="home__intro-title feed-detail-overlay__section-title" ref={contactTitleRef}>
                <span className="title-text">{t('contact.title', { ns: 'about' })}</span><span className="feed-detail-overlay__cursor">_</span>
              </h2>
              <div className="home__contact-subtitle">
                <span className="lineParent">
                  <span className="lineChild">{t('contact.subtitle', { ns: 'about' })}</span>
                </span>
              </div>
              <div className="home__contact-info" style={{ position: 'relative' }}>
                {showEmailTooltip && (
                  <span 
                    className="email-tooltip"
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 5px)',
                      left: '0%',
                      padding: '8px 10px 5px 10px',
                      backgroundColor: 'var(--hds-sys-color-theme-surface)',
                      color: 'var(--hds-sys-color-on-theme-surface)',
                      fontFamily: "'Pixel', 'Courier New', Courier, monospace",
                      fontSize: '15px',
                      whiteSpace: 'nowrap',
                      zIndex: 1000,
                      animation: 'fadeIn 0.2s ease-in-out',
                      pointerEvents: 'none',
                      textTransform: 'uppercase',
                    }}
                  >
                    {t('contact.emailCopied', { ns: 'about' })}
                  </span>
                )}
                <span className="lineParent">
                  <a 
                    ref={emailRef}
                    href="mailto:harrychuang23@gmail.com" 
                    className="home__contact-email lineChild"
                    onClick={handleCopyEmail}
                    style={{ cursor: 'pointer' }}
                  >
                    harrychuang23@gmail.com
                  </a>
                </span>
                <span className="lineParent">
                  <a href="tel:+886921706170" className="home__contact-phone lineChild">
                    +886 921 706 170
                  </a>
                </span>
              </div>
              <div className="home__contact-social" style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '15px',
                marginTop: '30px',
                textTransform: 'uppercase',
              }}>
                <span className="lineParent">
                  <a 
                    href="https://harrychuang23.medium.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="home__contact-social-link lineChild"
                    style={{
                      fontFamily: "'Pixel', 'Courier New', Courier, monospace",
                      fontSize: '15px',
                      color: 'var(--hds-sys-color-theme-surface)',
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                  >
                    + Medium +
                  </a>
                </span>
                <span className="lineParent">
                  <a 
                    href="https://www.threads.com/@harrychuang.ds" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="home__contact-social-link lineChild"
                    style={{
                      fontFamily: "'Pixel', 'Courier New', Courier, monospace",
                      fontSize: '15px',
                      color: 'var(--hds-sys-color-theme-surface)',
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                  >
                    + Threads +
                  </a>
                </span>
                <span className="lineParent">
                  <a 
                    href="https://www.linkedin.com/in/harrychuang/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="home__contact-social-link lineChild"
                    style={{
                      fontFamily: "'Pixel', 'Courier New', Courier, monospace",
                      fontSize: '15px',
                      color: 'var(--hds-sys-color-theme-surface)',
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                  >
                    + LinkedIn +
                  </a>
                </span>
              </div>
              <div className="home__contact-animation" ref={contactAnimationRef} style={{ position: 'absolute', bottom: -100, right: -200 }}>
                <HarryAnimation
                  type="usemac"
                  frameDuration={750}
                  width="500px"
                  autoPlay={true}
                  enableParticles={true}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;


