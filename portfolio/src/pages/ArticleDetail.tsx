import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { audioManager, type PlaybackHandle } from '../../../harryds/src/utils/audioManager';
import { useTheme } from '../theme/useTheme';
import { useSound } from '../hooks/useSound';
import { useArticles } from '../hooks/useArticles';
import { FeedCard } from 'hds';
import './ArticleDetail.scss';
import Header from '../components/Header';
import SEO from '../components/SEO';
import hoverSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep.mp3';
import clickSoundUrl from '../../assets/sound/8-Bit Sound Effect 28-1.mp3';
import { usePageLoader } from '../contexts/PageLoaderContext';
import { useContactModal } from '../contexts/ContactModalContext';
import { trackArticleView, trackRelatedArticleClick, trackTopicClick, trackCarouselInteraction, trackLanguageChange, trackThemeChange, trackContactOpen } from '../utils/analytics';

const PAGE_NAME = 'article-detail';

// ============================================================================
// 模組級別的圖片預載 Cache - 避免重複預載已載入過的圖片
// ============================================================================
const preloadedImagesCache = new Set<string>();

const ArticleDetail: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ id: string; slug: string }>();
  const { t, i18n } = useTranslation(['common', 'articles']);
  const { theme, toggleTheme } = useTheme();
  const { isSoundEnabled, toggleSound } = useSound();
  const { items, loading: articlesLoading } = useArticles();
  const { setLoading, setAnimationComplete, isPageLoaded, markPageAsLoaded } = usePageLoader();
  const { openContactModal } = useContactModal();
  
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);

  // 根據 URL 參數和 cache 中的資料，判斷當前文章的圖片是否已經預載過
  // 這是在組件初始化時就執行的，用於快速判斷是否需要顯示 loading
  const initialArticleImages = useMemo(() => {
    const id = params.id ? parseInt(params.id, 10) : null;
    if (id === null || isNaN(id)) return [];
    const article = items.find(item => item.id === id);
    return article?.images || [];
  }, [params.id, items]);

  // 檢查當前文章的圖片是否都已經在 cache 中
  const allImagesInCache = useMemo(() => {
    if (initialArticleImages.length === 0) return true;
    const imagesToCheck = initialArticleImages.filter((src: string) => {
      const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(src);
      return !isVideo;
    });
    if (imagesToCheck.length === 0) return true;
    return imagesToCheck.every((src: string) => preloadedImagesCache.has(src));
  }, [initialArticleImages]);

  // 整體載入狀態（資料 + 圖片）
  // 如果所有圖片都在 cache 中，視為已預載
  const isFullyLoaded = !articlesLoading && (imagesPreloaded || allImagesInCache);
  
  // 同步 loading 狀態到全域 PageLoader
  useEffect(() => {
    // 使用文章 ID 作為唯一頁面識別
    const pageKey = params.id ? `${PAGE_NAME}-${params.id}` : PAGE_NAME;
    const alreadyLoaded = isPageLoaded(pageKey);
    
    if (alreadyLoaded && isFullyLoaded) {
      // 頁面已載入過且資料和圖片都準備好，直接跳過 loading
      setLoading(false);
      setAnimationComplete(true);
    } else if (alreadyLoaded) {
      // 頁面已載入過但資料或圖片還在載入中，跳過 loading 動畫
      setAnimationComplete(true);
    } else {
      // 首次載入，顯示 loading
      setLoading(!isFullyLoaded);
      // 載入完成後標記頁面為已載入
      if (isFullyLoaded) {
        markPageAsLoaded(pageKey);
      }
    }
  }, [isFullyLoaded, setLoading, isPageLoaded, markPageAsLoaded, setAnimationComplete, params.id]);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const menuHoverHandleRef = useRef<PlaybackHandle | null>(null);
  const menuClickHandleRef = useRef<PlaybackHandle | null>(null);
  const logoHoverHandleRef = useRef<PlaybackHandle | null>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  // carousel wrapper 寬度（會即時從 DOM 獲取）
  const [carouselWrapperWidth, setCarouselWrapperWidth] = useState(0);
  const [mediaWidths, setMediaWidths] = useState<number[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);
  const carouselWrapperRef = useRef<HTMLDivElement>(null);
  const mediaRefs = useRef<(HTMLImageElement | HTMLVideoElement | null)[]>([]);

  // 追蹤視窗寬度，用於響應式尺寸調整
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1400);

  // 追蹤媒體元素的寬度
  const updateMediaWidths = useCallback(() => {
    const widths = mediaRefs.current.map(ref => ref?.offsetWidth || 600);
    setMediaWidths(widths);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      // 視窗大小改變時也更新媒體寬度
      setTimeout(() => updateMediaWidths(), 50);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateMediaWidths]);

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

  // 根據 URL 參數找到對應的文章
  const article = useMemo(() => {
    const id = params.id ? parseInt(params.id, 10) : null;
    if (id === null || isNaN(id)) return null;
    return items.find(item => item.id === id);
  }, [params.id, items]);

  // GA 追蹤：文章瀏覽（當文章載入完成時）
  useEffect(() => {
    if (article && isFullyLoaded) {
      trackArticleView(article.id, article.heading, article.tags);
    }
  }, [article?.id, isFullyLoaded]);

  // 找出相關文章（根據 tags/topics 相似度，加入多樣性演算法）
  const relatedArticles = useMemo(() => {
    if (!article || !article.tags || article.tags.length === 0) return [];
    
    // 計算每篇文章的相關性分數
    const scored = items
      .filter(item => item.id !== article.id) // 排除當前文章
      .map(item => {
        // 計算共同 tags 數量
        const commonTags = item.tags?.filter(tag => 
          article.tags.includes(tag)
        ) || [];
        const tagScore = commonTags.length;
        
        // 加入新鮮度分數（ID 越大代表越新，給予小幅加成）
        const maxId = Math.max(...items.map(i => i.id));
        const freshnessBonus = (item.id / maxId) * 0.3;
        
        return { 
          item, 
          tagScore, 
          commonTags,
          totalScore: tagScore + freshnessBonus 
        };
      })
      .filter(s => s.tagScore > 0); // 只要有共同 tag 的
    
    if (scored.length === 0) return [];
    
    // 分層取樣演算法：避免總是推薦相同的文章組合
    // 1. 按分數分組
    const maxTagScore = Math.max(...scored.map(s => s.tagScore));
    const highTier = scored.filter(s => s.tagScore === maxTagScore);
    const midTier = scored.filter(s => s.tagScore > 0 && s.tagScore < maxTagScore);
    
    // 2. 使用文章 ID 作為種子來產生一致但有變化的選擇
    const seed = article.id;
    const pseudoRandom = (index: number) => ((seed * 9301 + 49297) % 233280 + index * 7) % 233280 / 233280;
    
    // 3. 選擇邏輯：優先從高分層取 1 篇，再從中分層取 1 篇（增加多樣性）
    const result: typeof scored = [];
    
    if (highTier.length > 0) {
      // 從高分層隨機選 1 篇
      const highIndex = Math.floor(pseudoRandom(0) * highTier.length);
      result.push(highTier[highIndex]);
    }
    
    if (midTier.length > 0 && result.length < 2) {
      // 從中分層選 1 篇（增加探索性）
      const midIndex = Math.floor(pseudoRandom(1) * midTier.length);
      result.push(midTier[midIndex]);
    }
    
    // 如果中分層不足，繼續從高分層補充
    if (result.length < 2 && highTier.length > 1) {
      const remaining = highTier.filter(h => !result.includes(h));
      if (remaining.length > 0) {
        const index = Math.floor(pseudoRandom(2) * remaining.length);
        result.push(remaining[index]);
      }
    }
    
    // 如果還是不足，從所有符合條件的文章中補充
    if (result.length < 2) {
      const remaining = scored.filter(s => !result.includes(s));
      remaining.sort((a, b) => b.totalScore - a.totalScore);
      while (result.length < 2 && remaining.length > 0) {
        result.push(remaining.shift()!);
      }
    }
    
    return result.slice(0, 2).map(s => s.item);
  }, [article, items]);

  // 預載文章圖片（使用模組級別的 cache）
  useEffect(() => {
    if (!article?.images || article.images.length === 0) {
      setImagesPreloaded(true);
      return;
    }

    const imagesToPreload = article.images.filter((src: string) => {
      // 只預載圖片，不預載影片
      const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(src);
      // 使用模組級別的 cache 來檢查
      return !isVideo && !preloadedImagesCache.has(src);
    });

    if (imagesToPreload.length === 0) {
      // 所有圖片都已經在 cache 中
      setImagesPreloaded(true);
      return;
    }

    let loadedCount = 0;
    const totalImages = imagesToPreload.length;

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalImages) {
        setImagesPreloaded(true);
      }
    };

    imagesToPreload.forEach((src: string) => {
      const img = new Image();
      img.onload = () => {
        // 將圖片加入模組級別的 cache
        preloadedImagesCache.add(src);
        checkAllLoaded();
      };
      img.onerror = () => {
        // 即使載入失敗也標記為已處理（避免重複嘗試）
        preloadedImagesCache.add(src);
        checkAllLoaded();
      };
      img.src = src;
    });

    // 設定超時，避免圖片載入過久
    const timeout = setTimeout(() => {
      setImagesPreloaded(true);
    }, 3000);

    return () => {
      clearTimeout(timeout);
    };
  }, [article?.images, article?.id]);

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
        // 從 sessionStorage 讀取之前選擇的 topic
        const savedTopic = sessionStorage.getItem('articles-selected-topic');
        const articlesUrl = savedTopic ? `/articles?topic=${encodeURIComponent(savedTopic)}` : '/articles';
        
        // 如果頁面已載入過，直接導航；否則先觸發 loading
        if (isPageLoaded('articles')) {
          navigate(articlesUrl);
        } else {
          setLoading(true);
          setTimeout(() => navigate(articlesUrl), 50);
        }
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
    // GA 追蹤：主題切換
    trackThemeChange(theme === 'light' ? 'dark' : 'light');
  }, [toggleTheme, theme]);

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
    const fromLang = i18n.language;
    i18n.changeLanguage(code);
    setIsLangDropdownOpen(false);
    // GA 追蹤：語言切換
    trackLanguageChange(fromLang, code);
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

  // Logo wrapper 樣式（參考 Home 的 RWD 設定）
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

  // 返回 Articles 列表（帶上之前選擇的 topic）
  const handleBackToArticles = useCallback(async () => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Back button sound play failed:', err);
    }
    
    // 從 sessionStorage 讀取之前選擇的 topic
    const savedTopic = sessionStorage.getItem('articles-selected-topic');
    if (savedTopic) {
      navigate(`/articles?topic=${encodeURIComponent(savedTopic)}`);
    } else {
      navigate('/articles');
    }
  }, [navigate]);

  // 點擊 Topic 標籤
  const handleTopicClick = useCallback(async (topic: string) => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Topic click sound play failed:', err);
    }
    // GA 追蹤：Topic 點擊
    trackTopicClick(topic, 'article_detail');
    navigate(`/articles?topic=${encodeURIComponent(topic)}`);
  }, [navigate]);

  // 點擊相關文章
  const handleRelatedArticleClick = useCallback(async (articleId: number) => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Related article click sound play failed:', err);
    }
    
    // 找到文章並生成 slug（與 Articles 頁面一致）
    const targetArticle = items.find(item => item.id === articleId);
    if (targetArticle) {
      // GA 追蹤：相關文章點擊
      if (article) {
        trackRelatedArticleClick(article.id, articleId, targetArticle.heading);
      }
      
      // 使用原始英文 heading 生成 slug，確保所有語系的 URL 一致
      const headingForSlug = (targetArticle as any).originalHeading || targetArticle.heading;
      const slug = headingForSlug.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      
      // 重置圖片預載狀態
      setImagesPreloaded(false);
      setCurrentImageIndex(0);
      navigate(`/article/${articleId}/${slug}`);
    }
  }, [items, navigate, article]);

  // 獲取文章圖片 - 從 useArticles hook 取得（支援 Strapi 或本地資料）
  const articleImages = useMemo(() => {
    return article?.images || [];
  }, [article]);

  // 獲取文章內容 - 從 article 物件取得（支援 Strapi 或本地資料）
  const articleContent = useMemo(() => {
    // article.content 可能是：
    // 1. Strapi 格式: { paragraph1: "...", paragraph2: "...", ... }
    // 2. 本地格式: { paragraph1: "...", paragraph2: "...", ... }
    const content = article?.content;
    
    if (!content) return [];
    
    // 如果是物件，提取所有 paragraph 值
    if (typeof content === 'object' && !Array.isArray(content)) {
      return Object.values(content).filter(Boolean) as string[];
    }
    
    // 如果已經是陣列，直接返回
    if (Array.isArray(content)) {
      return content.filter(Boolean) as string[];
    }
    
    return [];
  }, [article]);

  // Carousel 控制
  const handlePrevImage = useCallback(async () => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Prev button sound play failed:', err);
    }
    const newIndex = currentImageIndex === 0 ? articleImages.length - 1 : currentImageIndex - 1;
    setCurrentImageIndex(newIndex);
    // GA 追蹤：輪播操作
    if (article) {
      trackCarouselInteraction(article.id, 'prev', newIndex, articleImages.length);
    }
  }, [articleImages.length, currentImageIndex, article]);

  const handleNextImage = useCallback(async () => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Next button sound play failed:', err);
    }
    const newIndex = currentImageIndex === articleImages.length - 1 ? 0 : currentImageIndex + 1;
    setCurrentImageIndex(newIndex);
    // GA 追蹤：輪播操作
    if (article) {
      trackCarouselInteraction(article.id, 'next', newIndex, articleImages.length);
    }
  }, [articleImages.length, currentImageIndex, article]);

  const handlePageClick = useCallback(async (index: number) => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Page click sound play failed:', err);
    }
    setCurrentImageIndex(index);
    // GA 追蹤：輪播操作
    if (article) {
      trackCarouselInteraction(article.id, 'dot_click', index, articleImages.length);
    }
  }, [article, articleImages.length]);

  // 即時監聽 carousel wrapper 寬度變化
  useEffect(() => {
    const updateWidth = () => {
      const wrapper = carouselWrapperRef.current;
      if (wrapper) {
        const width = wrapper.clientWidth;
        if (width > 0) {
          setCarouselWrapperWidth(width);
        }
      }
    };

    // 延遲執行確保 DOM 已渲染
    const timeoutId = setTimeout(updateWidth, 50);
    
    // 監聽視窗 resize 事件
    window.addEventListener('resize', updateWidth);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  // 使用 ResizeObserver 監聯 wrapper 寬度變化（當 carousel 存在時）
  useEffect(() => {
    const wrapper = carouselWrapperRef.current;
    if (!wrapper) return;

    const updateWidth = () => {
      const width = wrapper.clientWidth;
      if (width > 0) {
        setCarouselWrapperWidth(width);
      }
    };

    // 立即獲取一次
    updateWidth();
    
    // 如果寬度還是 0，使用 requestAnimationFrame 重試
    // 這對於快速渲染（圖片已緩存）的情況很重要
    if (wrapper.clientWidth === 0) {
      const retryUpdate = () => {
        requestAnimationFrame(() => {
          const width = wrapper.clientWidth;
          if (width > 0) {
            setCarouselWrapperWidth(width);
          } else {
            // 再重試一次（最多 100ms 後）
            setTimeout(() => {
              const finalWidth = wrapper.clientWidth;
              if (finalWidth > 0) {
                setCarouselWrapperWidth(finalWidth);
              }
            }, 100);
          }
        });
      };
      retryUpdate();
    }
    
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(wrapper);

    return () => {
      resizeObserver.disconnect();
    };
  }, [articleImages.length]); // 當圖片數量變化時重新綁定

  // 當媒體載入完成時更新寬度
  const handleMediaLoad = useCallback((index: number) => {
    // 延遲一點確保 DOM 已更新
    setTimeout(() => {
      updateMediaWidths();
      // 同時也更新 wrapper 寬度（防止首次載入時寬度為 0）
      const wrapper = carouselWrapperRef.current;
      if (wrapper && carouselWrapperWidth === 0) {
        const width = wrapper.clientWidth;
        if (width > 0) {
          setCarouselWrapperWidth(width);
        }
      }
    }, 50);
  }, [updateMediaWidths, carouselWrapperWidth]);
  
  // 當 currentImageIndex 改變時，確保 carouselWrapperWidth 有值
  // 這是解決「點擊 prev/next 按鈕但圖片不動」問題的關鍵
  useEffect(() => {
    if (carouselWrapperWidth === 0 && articleImages.length > 0) {
      const wrapper = carouselWrapperRef.current;
      if (wrapper) {
        // 使用 requestAnimationFrame 確保 DOM 已更新
        requestAnimationFrame(() => {
          const width = wrapper.clientWidth;
          if (width > 0) {
            setCarouselWrapperWidth(width);
          }
        });
      }
    }
  }, [currentImageIndex, carouselWrapperWidth, articleImages.length]);

  // 監聽 articleImages 變化時重置 mediaRefs
  useEffect(() => {
    mediaRefs.current = mediaRefs.current.slice(0, articleImages.length);
    // 初始化時也更新一次寬度
    setTimeout(() => {
      updateMediaWidths();
    }, 100);
  }, [articleImages.length, updateMediaWidths]);

  // 計算 transform，確保當前圖片完整顯示，最後一張圖片右邊對齊容器右邊
  const carouselTransform = useMemo(() => {
    const totalImages = articleImages.length;
    
    // 小螢幕使用較小的 gap
    const gap = windowWidth <= 767 ? 20 : 50;
    const isMobile = windowWidth <= 767;
    
    // 如果 wrapper 寬度尚未獲取
    if (carouselWrapperWidth === 0) {
      // Mobile 端使用百分比計算作為 fallback（每張圖片 100% 寬度）
      if (isMobile && currentImageIndex > 0) {
        // 每張圖片佔 100% + gap
        const offset = currentImageIndex * (100 + (gap / windowWidth * 100));
        return `translateX(-${offset}%)`;
      }
      return 'translateX(0px)';
    }
    
    // 使用實際媒體寬度，如果還未載入則使用預設值
    // Mobile 端預設使用容器寬度，桌面端使用 600
    const defaultWidth = isMobile ? carouselWrapperWidth : 600;
    const widths = mediaWidths.length === totalImages ? mediaWidths : Array(totalImages).fill(defaultWidth);
    
    // 計算總寬度
    const totalWidth = widths.reduce((sum, w) => sum + w, 0) + (totalImages - 1) * gap;
    
    // 最大偏移量：讓 carousel 最右邊對齊 wrapper 最右邊
    const maxOffset = Math.max(0, totalWidth - carouselWrapperWidth);
    
    // 計算當前圖片的起始位置
    let currentImageStart = 0;
    for (let i = 0; i < currentImageIndex; i++) {
      currentImageStart += widths[i] + gap;
    }
    
    let targetOffset: number;
    
    // 如果是最後一張圖片，強制讓它的右邊對齊容器右邊
    if (currentImageIndex === totalImages - 1) {
      targetOffset = maxOffset;
    } else {
      // 其他圖片：讓當前圖片左邊對齊容器左邊，但不超過 maxOffset
      targetOffset = Math.min(currentImageStart, maxOffset);
    }
    
    const offset = Math.max(0, targetOffset - dragOffset);
    
    return `translateX(-${offset}px)`;
  }, [currentImageIndex, dragOffset, articleImages.length, carouselWrapperWidth, mediaWidths, windowWidth]);

  // 判斷媒體類型
  const isVideoFile = useCallback((filename: string) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }, []);

  // 連結文字對應不同語言
  const linkTextMap: Record<string, string> = {
    'zh-Hant': '🔗 連結',
    'zh': '🔗 連結',
    'en': '🔗 Link',
    'ja': '🔗 リンク'
  };

  // 解析段落中的連結格式：文字（URL）或 文字(URL)
  const renderParagraphWithLinks = useCallback((text: string) => {
    // 匹配 文字（URL）或 文字 (URL) 的格式
    // 支援全形括號（）和半形括號()，以及括號前可選的空格
    const linkRegex = /([^\s（(][^（(]*?)\s*[（(](https?:\/\/[^\s）)]+)[）)]/g;
    
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      // 添加連結前的文字
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const linkLabel = match[1];
      const url = match[2];
      const linkText = linkTextMap[i18n.language] || linkTextMap['en'];

      // 添加連結元素
      parts.push(
        <React.Fragment key={match.index}>
          {linkLabel}{' '}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="article-detail__link"
          >
            [ {linkText} ]
          </a>
        </React.Fragment>
      );

      lastIndex = match.index + match[0].length;
    }

    // 添加剩餘的文字
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  }, [i18n.language]);

  // Drag handlers
  const handleDragStart = useCallback((clientX: number) => {
    setIsDragging(true);
    setDragStartX(clientX);
  }, []);

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - dragStartX; // 手指移動的距離
    setDragOffset(diff);
  }, [isDragging, dragStartX]);

  const handleDragEnd = useCallback(async () => {
    if (!isDragging) return;
    setIsDragging(false);

    // 使用當前媒體的寬度來計算 threshold
    const currentMediaWidth = mediaWidths[currentImageIndex] || 600;
    const gap = 50;
    const threshold = (currentMediaWidth + gap) / 3; // 1/3 of media width to trigger change

    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        // Dragged right - previous image
        if (currentImageIndex > 0) {
          try {
            menuClickHandleRef.current?.stop();
            menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
          } catch (err) {
            console.warn('Drag sound play failed:', err);
          }
          setCurrentImageIndex((prev) => prev - 1);
        }
      } else {
        // Dragged left - next image
        if (currentImageIndex < articleImages.length - 1) {
          try {
            menuClickHandleRef.current?.stop();
            menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
          } catch (err) {
            console.warn('Drag sound play failed:', err);
          }
          setCurrentImageIndex((prev) => prev + 1);
        }
      }
    }

    setDragOffset(0);
  }, [isDragging, dragOffset, currentImageIndex, articleImages.length, mediaWidths]);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  }, [handleDragStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleDragMove(e.clientX);
  }, [handleDragMove]);

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Global mouse up listener
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => {
        handleDragEnd();
      };
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, handleDragEnd]);

  // 資料載入中或圖片預載中，不渲染任何內容（讓 PageLoader 處理）
  if (!isFullyLoaded) {
    return null;
  }

  // 資料載入完成但找不到文章，顯示錯誤
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
          menuItems={['work', 'articles', 'about']}
          activeMenuItem="articles"
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
          onContactClick={() => { 
          openContactModal(); 
          trackContactOpen('header');
        }}
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
      {/* SEO Meta Tags - 動態根據文章內容設定 */}
      <SEO
        title={article.heading}
        description={article.subtitle}
        image={article.images?.[0]}
        path={`article/${article.id}/${params.slug}`}
        type="article"
        publishedTime={article.date}
        keywords={article.tags}
      />
      
      <Header
        onLogoClick={handleBackToArticles}
        onLogoMouseEnter={handleLogoHover}
        onLogoMouseLeave={handleLogoLeave}
        logoType="back"
        logoAnimated={isLogoHovered}
        logoWrapperStyle={logoWrapperStyle}
        menuItems={['work', 'articles', 'about']}
        activeMenuItem="articles"
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
        onContactClick={() => { 
          openContactModal(); 
          trackContactOpen('header');
        }}
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
                    <span 
                      className="article-detail__topic-link"
                      onClick={() => handleTopicClick(tag)}
                      onMouseEnter={handleMenuItemHover}
                    >
                      {tag}
                    </span>
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
              <div 
                ref={carouselWrapperRef}
                className="article-detail__carousel-wrapper"
                style={{ 
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div 
                  ref={carouselRef}
                  className="article-detail__carousel-images"
                  style={{ 
                    transform: carouselTransform,
                    transition: isDragging ? 'none' : 'transform 0.5s ease-in-out'
                  }}
                >
                  {articleImages.map((media: string, index: number) => (
                    isVideoFile(media) ? (
                      <video
                        key={index}
                        ref={(el) => { mediaRefs.current[index] = el; }}
                        src={media}
                        className="article-detail__carousel-media article-detail__carousel-video"
                        draggable={false}
                        autoPlay
                        loop
                        muted
                        playsInline
                        onLoadedMetadata={() => handleMediaLoad(index)}
                      />
                    ) : (
                      <img
                        key={index}
                        ref={(el) => { mediaRefs.current[index] = el; }}
                        src={media}
                        alt={`${article.heading} - Image ${index + 1}`}
                        className="article-detail__carousel-media article-detail__carousel-image"
                        draggable={false}
                        onLoad={() => handleMediaLoad(index)}
                      />
                    )
                  ))}
                </div>
              </div>

              {articleImages.length > 1 && (
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
              )}
            </div>
          )}

          {/* Article Content */}
          {articleContent.length > 0 && (
            <div className="article-detail__content-section">
              {articleContent.map((paragraph, index) => (
                <p key={index} className="article-detail__paragraph">
                  {renderParagraphWithLinks(paragraph)}
                </p>
              ))}
            </div>
          )}

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="article-detail__related">
              <h2 className="article-detail__related-title">
                {t('common:relatedArticles', 'Related Articles')}
              </h2>
              <div className="article-detail__related-grid">
                {relatedArticles.map(relatedItem => (
                  <div 
                    key={relatedItem.id}
                    className="article-detail__related-card"
                    onClick={() => handleRelatedArticleClick(relatedItem.id)}
                  >
                    <FeedCard
                      src={relatedItem.heroImage || ''}
                      size={windowWidth <= 900 ? 'xs' : 'sm'}
                      height={windowWidth <= 900 ? 250 : 400}
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
                        heading: relatedItem.heading,
                        date: relatedItem.date,
                        tags: relatedItem.tags?.length > 1 
                          ? [relatedItem.tags[1]] 
                          : (relatedItem.tags?.length > 0 ? [relatedItem.tags[0]] : []),
                        category: relatedItem.category
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ArticleDetail;

