import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { audioManager, type PlaybackHandle } from '../../../harryds/src/utils/audioManager';
import { useTheme } from '../theme/useTheme';
import { useSound } from '../hooks/useSound';
import { useArticles } from '../hooks/useArticles';
import { FeedCard } from 'hds';
import type { FeedCardSize } from 'hds';
import './Articles.scss';
import Header from '../components/Header';
import SEO, { SEOPresets } from '../components/SEO';
import hoverSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep.mp3';
import clickSoundUrl from '../../assets/sound/8-Bit Sound Effect 28-1.mp3';
import { usePageLoader } from '../contexts/PageLoaderContext';
import { useContactModal } from '../contexts/ContactModalContext';

const PAGE_NAME = 'articles';

const Articles: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation(['common', 'articles']);
  const { theme, toggleTheme } = useTheme();
  const { isSoundEnabled, toggleSound } = useSound();
  const { items: rawItems, loading: articlesLoading } = useArticles();
  const { setLoading, isPageLoaded, markPageAsLoaded, setAnimationComplete } = usePageLoader();
  const { openContactModal } = useContactModal();
  
  // 頁面進入時檢查是否已載入過
  useEffect(() => {
    const alreadyLoaded = isPageLoaded(PAGE_NAME);
    
    if (alreadyLoaded) {
      // 頁面已載入過，直接跳過 loading
      setLoading(false);
      setAnimationComplete(true);
    } else if (!articlesLoading) {
      // 首次載入且資料已準備好
      setLoading(false);
      markPageAsLoaded(PAGE_NAME);
    }
  }, [articlesLoading, isPageLoaded, setLoading, setAnimationComplete, markPageAsLoaded]);

  // 按日期從新到舊排序
  const items = useMemo(() => {
    return [...rawItems].sort((a, b) => {
      const dateA = new Date(a.date || '');
      const dateB = new Date(b.date || '');
      return dateB.getTime() - dateA.getTime(); // 新的在前
    });
  }, [rawItems]);

  // 從 URL 讀取 topic 參數，預設為 'all'
  const topicFromUrl = searchParams.get('topic') || 'all';
  
  // Topics 選項狀態
  const [selectedTopic, setSelectedTopic] = useState<string>(topicFromUrl);
  const [isTopicsExpanded, setIsTopicsExpanded] = useState(false);
  
  // 初始顯示的 topic 數量（不含 All）
  const INITIAL_TOPICS_COUNT = 5;

  // 從所有文章中提取 tags 並按出現次數排序
  const sortedTopics = useMemo(() => {
    const tagCount: Record<string, number> = {};
    items.forEach((item) => {
      item.tags?.forEach((tag: string) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    // 按出現次數由多到少排序
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }, [items]);

  // 當 URL 參數變化時同步 state（例如瀏覽器返回）
  useEffect(() => {
    setSelectedTopic(topicFromUrl);
    // 如果選擇的 topic 不在初始顯示的前幾個中，自動展開
    if (topicFromUrl !== 'all') {
      const topicIndex = sortedTopics.indexOf(topicFromUrl);
      if (topicIndex >= INITIAL_TOPICS_COUNT) {
        setIsTopicsExpanded(true);
      }
    }
  }, [topicFromUrl, sortedTopics]);

  // 根據選擇的 topic 篩選文章
  const filteredItems = useMemo(() => {
    if (selectedTopic === 'all') return items;
    return items.filter((item) => item.tags?.includes(selectedTopic));
  }, [items, selectedTopic]);

  // 計算每個卡片的 column span（2 columns = span 3, 3 columns = span 2）
  // 第一排固定 2 columns，之後隨機 2 或 3 columns
  const cardSpanMap = useMemo(() => {
    const spanMap: Record<number, number> = {};
    const remainingItems = filteredItems.slice(2); // 跳過前兩個 featured
    
    if (remainingItems.length === 0) return spanMap;
    
    // 使用基於文章 ID 的 seed 來產生穩定的隨機序列
    const seed = filteredItems.reduce((acc, item) => acc + item.id, 0);
    let randomIndex = seed;
    const seededRandom = () => {
      randomIndex = (randomIndex * 9301 + 49297) % 233280;
      return randomIndex / 233280;
    };
    
    let currentIndex = 0;
    while (currentIndex < remainingItems.length) {
      // 隨機決定這一排是 2 columns (span 3) 還是 3 columns (span 2)
      // 2 columns 比例為 20%，3 columns 為 80%
      const isTwoColumns = seededRandom() < 0.4;
      const cardsInRow = isTwoColumns ? 2 : 3;
      const spanValue = isTwoColumns ? 3 : 2;
      
      // 檢查剩餘卡片數量
      const remainingCount = remainingItems.length - currentIndex;
      
      // 如果剩餘數量小於等於這一排要放的數量，直接放完
      if (remainingCount <= cardsInRow) {
        // 平均分配最後幾張卡片
        const finalSpan = Math.floor(6 / remainingCount);
        for (let i = currentIndex; i < remainingItems.length; i++) {
          spanMap[remainingItems[i].id] = finalSpan;
        }
        break;
      }
      
      // 分配這一排的卡片
      for (let i = 0; i < cardsInRow && currentIndex < remainingItems.length; i++) {
        spanMap[remainingItems[currentIndex].id] = spanValue;
        currentIndex++;
      }
    }
    
    return spanMap;
  }, [filteredItems]);

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
        // 已經在 articles 頁面
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

  // Topic 點擊處理
  const handleTopicClick = useCallback(async (topic: string) => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Topic click sound play failed:', err);
    }
    setSelectedTopic(topic);
    // 更新 URL 參數
    if (topic === 'all') {
      searchParams.delete('topic');
      // 清除 sessionStorage 中的 topic
      sessionStorage.removeItem('articles-selected-topic');
    } else {
      searchParams.set('topic', topic);
      // 保存選擇的 topic 到 sessionStorage，讓 ArticleDetail 返回時可以使用
      sessionStorage.setItem('articles-selected-topic', topic);
    }
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // 展開/收合 topics
  const handleToggleTopics = useCallback(async () => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Toggle topics sound play failed:', err);
    }
    setIsTopicsExpanded((prev) => !prev);
  }, []);

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
      {/* SEO Meta Tags */}
      <SEO {...SEOPresets.articles} />
      
      <Header
        onLogoClick={handleLogoClick}
        logoType="default"
        logoAnimated={true}
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
        menuItems={['work', 'articles', 'about']}
        activeMenuItem="articles"
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
        onContactClick={() => { playMenuClickSound(); openContactModal(); }}
      />

      {/* Topics Filter Bar */}
      <div className={`articles-page__topics-bar ${isTopicsExpanded ? 'articles-page__topics-bar--expanded' : ''}`}>
        <button
          className={`articles-page__topic-item ${selectedTopic === 'all' ? 'articles-page__topic-item--active' : ''}`}
          onClick={() => handleTopicClick('all')}
          onMouseEnter={playMenuHoverSound}
        >
          {selectedTopic === 'all' ? '[All]' : 'All'}
        </button>
        {(isTopicsExpanded ? sortedTopics : sortedTopics.slice(0, INITIAL_TOPICS_COUNT)).map((topic) => (
          <button
            key={topic}
            className={`articles-page__topic-item ${selectedTopic === topic ? 'articles-page__topic-item--active' : ''}`}
            onClick={() => handleTopicClick(topic)}
            onMouseEnter={playMenuHoverSound}
          >
            {selectedTopic === topic ? `[${topic}]` : topic}
          </button>
        ))}
        {sortedTopics.length > INITIAL_TOPICS_COUNT && (
          <button
            className="articles-page__topic-item articles-page__topic-item--more"
            onClick={handleToggleTopics}
            onMouseEnter={playMenuHoverSound}
          >
            {isTopicsExpanded ? '...less' : '...more topics'}
          </button>
        )}
      </div>

      <main className="articles-page__content">
        <div className="articles-page__grid">
          {filteredItems.map((article, index) => {
            // 前兩個為 featured，其餘為 xs
            // 當螢幕 < 1200px 時：左邊(index=0) 改為 sm，右邊(index=1) 改為 xs
            const size: FeedCardSize = (() => {
              if (index === 0) {
                if (windowWidth <= 767) return 'xs';
                if (windowWidth < 1200) return 'sm';
                return 'med';
              }
              if (index === 1) {
                return windowWidth < 1200 ? 'xs' : 'med';
              }
              return 'xs';
            })();
            const height = (() => {
              if (index === 0) {
                if (windowWidth <= 767) return 250;
                if (windowWidth < 1200) return 400;
                return 500;
              }
              if (index === 1) return windowWidth < 1200 ? 250 : 500;
              return 250;
            })();
            const src = article.heroImage || '';
            
            // 決定 className 和 grid-column span
            let cardClass = 'article-card';
            let gridSpan = 2; // 預設 span 2
            
            if (index < 2) {
              // 前兩個 featured 卡片
              cardClass += ' article-card--featured';
              // 當螢幕 < 1024px 時，改為單欄（span 6）
              gridSpan = windowWidth < 1024 ? 6 : 3;
            } else {
              // 其他卡片根據隨機分配的 span
              gridSpan = cardSpanMap[article.id] || 2;
            }
            
            return (
              <div
                key={article.id}
                className={cardClass}
                onClick={() => handleCardClick(article.id)}
                style={{
                  ['--stagger-index' as any]: index,
                  gridColumn: `span ${gridSpan}`,
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
                    tags: article.tags.length > 1 ? [article.tags[1]] : (article.tags.length > 0 ? [article.tags[0]] : []),
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

