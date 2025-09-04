import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import './Home.scss';
import { useNavigate, useParams } from 'react-router-dom';
import { Logo, FeedDetailOverlay } from 'hds';
import type { FeedCardSize } from 'hds';
import type { FeedItem, FeedContentBlock } from '../../../harryds/src/types/feed';
import feed from 'shared/data/feed.json';
import hoverSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep.mp3';
import clickSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep 3.mp3';
import { audioManager, type PlaybackHandle } from '../../../harryds/src/utils/audioManager';

const slugify = (text: string) => text
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-');

const Home: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const items = useMemo(() => (feed as any).items as FeedItem[], []);

  const [openCardId, setOpenCardId] = useState<number | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);
  const [openCardAnimationPhase, setOpenCardAnimationPhase] = useState<'closed' | 'loading' | 'positioning' | 'expanding' | 'ready'>('closed');
  const [isLogoHovered, setIsLogoHovered] = useState<boolean>(false);
  const loadedCardIdsRef = useRef<Set<number>>(new Set());

  const originalHomeBackgroundRef = useRef<string>('');
  const homeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const staggerTimeoutsRef = useRef<number[]>([]);

  const logoHoverHandleRef = useRef<PlaybackHandle | null>(null);
  const logoClickHandleRef = useRef<PlaybackHandle | null>(null);
  const hasPlayedLogoHoverSoundRef = useRef<boolean>(false);
  const hasPlayedLogoClickSoundRef = useRef<boolean>(false);

  useEffect(() => {
    if (!originalHomeBackgroundRef.current && homeRef.current) {
      originalHomeBackgroundRef.current = getComputedStyle(homeRef.current).backgroundColor || 'var(--hds-sys-color-on-theme-surface)';
    }
  }, []);

  useEffect(() => {
    if (!homeRef.current) return;
    const activeCardId = (openCardId && openCardAnimationPhase === 'loading') ? openCardId : (openCardId || hoveredCardId);
    if (activeCardId) {
      const activeItem = items.find(item => item.id === activeCardId);
      if (activeItem && activeItem.secondaryColor) {
        homeRef.current.style.backgroundColor = activeItem.secondaryColor;
        homeRef.current.style.transition = 'background-color 0.3s ease';
      }
    } else {
      homeRef.current.style.backgroundColor = '';
      homeRef.current.style.transition = 'background-color 0.3s ease';
    }
  }, [openCardId, hoveredCardId, openCardAnimationPhase, items]);

  useEffect(() => {
    audioManager.preload(hoverSoundUrl).catch(() => {});
  }, []);
  useEffect(() => {
    audioManager.preload(clickSoundUrl).catch(() => {});
  }, []);

  const playLogoHoverSound = useCallback(async () => {
    if (hasPlayedLogoHoverSoundRef.current) return;
    if (!(openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready'))) return;
    try {
      logoHoverHandleRef.current?.stop();
      logoHoverHandleRef.current = await audioManager.play(hoverSoundUrl, { volume: 0.4 });
      hasPlayedLogoHoverSoundRef.current = true;
    } catch (err) {
      console.warn('Logo hover sound play failed:', err);
    }
  }, [openCardId, openCardAnimationPhase]);

  const playLogoClickSound = useCallback(async () => {
    if (hasPlayedLogoClickSoundRef.current) return;
    if (!(openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready'))) return;
    try {
      logoClickHandleRef.current?.stop();
      logoClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
      hasPlayedLogoClickSoundRef.current = true;
    } catch (err) {
      console.warn('Logo click sound play failed:', err);
    }
  }, [openCardId, openCardAnimationPhase]);

  const handleLogoHover = useCallback(() => {
    if (openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready')) {
      setIsLogoHovered(true);
      hasPlayedLogoHoverSoundRef.current = false;
      playLogoHoverSound();
    }
  }, [playLogoHoverSound, openCardId, openCardAnimationPhase]);

  const handleLogoLeave = useCallback(() => {
    setIsLogoHovered(false);
  }, []);

  const toItemUrl = useCallback((item: FeedItem) => {
    const slug = slugify(item.heading);
    return `/${item.category}/${item.id}/${slug}`;
  }, []);

  const handleOpenCard = useCallback((cardId: number) => {
    const item = items.find(i => i.id === cardId);
    if (!item) return;
    navigate(toItemUrl(item), { replace: false });
  }, [items, navigate, toItemUrl]);

  const handleCloseCard = useCallback(() => {
    setOpenCardId(null);
    setOpenCardAnimationPhase('closed');
    setHoveredCardId(null);
    setIsLogoHovered(false);
    hasPlayedLogoHoverSoundRef.current = false;
    hasPlayedLogoClickSoundRef.current = false;
    logoHoverHandleRef.current?.stop();
    logoClickHandleRef.current?.stop();
    navigate('/', { replace: false });
  }, [navigate]);

  const handleLogoClick = useCallback(() => {
    hasPlayedLogoClickSoundRef.current = false;
    playLogoClickSound();
    if (openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready')) {
      setTimeout(() => {
        handleCloseCard();
      }, 500);
    }
  }, [playLogoClickSound, openCardId, openCardAnimationPhase, handleCloseCard]);

  const handleAnimationPhaseChange = useCallback((phase: 'closed' | 'loading' | 'positioning' | 'expanding' | 'ready') => {
    console.log(`Animation phase changed to: ${phase}, openCardId: ${openCardId}`);
    setOpenCardAnimationPhase(phase);
    // 當動畫到達 ready 階段時，記錄該卡片已載入過
    if (phase === 'ready' && openCardId != null) {
      console.log(`Adding card ${openCardId} to loaded set`);
      loadedCardIdsRef.current.add(openCardId);
      console.log(`Loaded cards after add:`, Array.from(loadedCardIdsRef.current));
    }
  }, [openCardId]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    staggerTimeoutsRef.current.forEach((id) => clearTimeout(id));
    staggerTimeoutsRef.current = [];
    root.querySelectorAll<HTMLElement>('.pg-card.dimmed').forEach((el) => el.classList.remove('dimmed'));
    root.classList.remove('js-stagger-mode');

    if (openCardId && openCardAnimationPhase === 'loading') {
      root.classList.add('js-stagger-loading');
      const cards = Array.from(root.querySelectorAll<HTMLElement>('.pg-card'));
      const others = cards.filter((el) => Number(el.dataset.id) !== openCardId);
      const stepMs = 25;
      others.forEach((el, i) => {
        const t = window.setTimeout(() => {
          el.classList.add('dimmed');
        }, i * stepMs);
        staggerTimeoutsRef.current.push(t);
      });
    } else {
      root.classList.remove('js-stagger-loading');
      if (!openCardId && hoveredCardId) {
        root.classList.add('js-stagger-mode');
        const targetId = hoveredCardId;
        const cards = Array.from(root.querySelectorAll<HTMLElement>('.pg-card'));
        const others = cards.filter((el) => Number(el.dataset.id) !== targetId && el.dataset.open !== 'true');
        const stepMs = 25;
        others.forEach((el, i) => {
          const t = window.setTimeout(() => {
            el.classList.add('dimmed');
          }, i * stepMs);
          staggerTimeoutsRef.current.push(t);
        });
      }
    }
  }, [openCardId, openCardAnimationPhase, hoveredCardId]);

  const handleCardHover = useCallback((cardId: number) => {
    if (openCardId) return;
    setHoveredCardId(cardId);
    const root = contentRef.current;
    if (!root) return;
    staggerTimeoutsRef.current.forEach((id) => clearTimeout(id));
    staggerTimeoutsRef.current = [];
    root.classList.remove('js-stagger-loading');
    root.classList.add('js-stagger-mode');
    root.querySelectorAll<HTMLElement>('.pg-card.dimmed').forEach((el) => el.classList.remove('dimmed'));
    const cards = Array.from(root.querySelectorAll<HTMLElement>('.pg-card'));
    const others = cards.filter((el) => Number(el.dataset.id) !== cardId && el.dataset.open !== 'true');
    const stepMs = 25;
    others.forEach((el, i) => {
      const t = window.setTimeout(() => {
        el.classList.add('dimmed');
      }, i * stepMs);
      staggerTimeoutsRef.current.push(t);
    });
  }, [openCardId]);

  const handleCardLeave = useCallback(() => {
    setHoveredCardId(null);
    const root = contentRef.current;
    if (!root) return;
    staggerTimeoutsRef.current.forEach((id) => clearTimeout(id));
    staggerTimeoutsRef.current = [];
    root.classList.remove('js-stagger-mode');
    root.querySelectorAll<HTMLElement>('.pg-card.dimmed').forEach((el) => el.classList.remove('dimmed'));
  }, []);

  const logoColors = useMemo(() => {
    const activeCardId = openCardId || hoveredCardId;
    if (activeCardId) {
      const activeItem = items.find(item => item.id === activeCardId);
      if (activeItem && activeItem.primaryColor && activeItem.secondaryColor) {
        return {
          primaryColor: activeItem.primaryColor,
          secondaryColor: activeItem.secondaryColor,
        } as any;
      }
    }
    return {} as any;
  }, [openCardId, hoveredCardId, items]);

  const logoKey = useMemo(() => {
    const logoType = openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready') ? 'back' : 'default';
    const hasCustomColors = openCardId || hoveredCardId;
    const isAnimated = logoType === 'back' ? isLogoHovered : true;
    return `${logoType}-${hasCustomColors ? 'custom' : 'default'}-${isAnimated ? 'animated' : 'static'}`;
  }, [openCardId, hoveredCardId, openCardAnimationPhase, isLogoHovered]);

  const getSizeByIndex = (index: number): FeedCardSize => {
    if (index === 0) return 'hero';
    if (index <= 2) return 'med';
    if (index <= 5) return 'sm';
    return 'xs';
  };

  const imageModules = useMemo(() => (
    import.meta.glob('../../assets/imgs/**/*', { eager: true, import: 'default' }) as Record<string, string>
  ), []);

  const resolveSrc = (fileName?: string) => {
    if (!fileName) return '';
    const key = `../../assets/imgs/${fileName}`;
    if (imageModules[key]) return imageModules[key];
    return new URL(`../../assets/imgs/${fileName}`, import.meta.url).href;
  };

  useEffect(() => {
    // 將 URL 狀態反映到 openCardId
    const idParam = params.id; // 單獨的 id
    const category = params.category as 'article' | 'project' | undefined;
    if (!idParam || !category) {
      setOpenCardId(null);
      return;
    }
    const id = Number(idParam);
    if (!id || Number.isNaN(id)) {
      setOpenCardId(null);
      return;
    }
    const item = items.find(i => i.id === id && i.category === category);
    if (item) {
      setOpenCardId(item.id);
    } else {
      setOpenCardId(null);
    }
  }, [params.id, params.category, items]);

  return (
    <div ref={homeRef} className="home">
      <header className="home__header">
        <div className="header-content">
          <div 
            onClick={handleLogoClick}
            onMouseEnter={handleLogoHover}
            onMouseLeave={handleLogoLeave}
            style={{ 
              cursor: openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready') ? 'pointer' : 'default',
              transform: openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready') ? 'translateX(-10px)' : 'translateX(0px)',
              transition: 'transform 0.3s ease'
            }}
          >
            <Logo 
              key={logoKey}
              type={openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready') ? 'back' : 'default'}
              animated={openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready') ? isLogoHovered : true}
              {...logoColors}
            />
          </div>
        </div>
      </header>
      <div className="home__container">
        <div
          className="home__content"
          data-phase={openCardAnimationPhase}
          data-open-id={openCardId ?? undefined}
          data-hover-id={hoveredCardId ?? undefined}
          ref={contentRef}
        >
          {items.slice(0, 9).map((item, index) => {
            const size = getSizeByIndex(index);
            const src = resolveSrc(item.heroImage);
            const rawBlocks: FeedContentBlock[] | undefined =
              Array.isArray(item.content)
                ? (item.content as FeedContentBlock[])
                : (typeof item.content === 'string'
                    ? ([{ type: 'paragraph', content: item.content }] as FeedContentBlock[])
                    : undefined);
            const resolvedBlocks = rawBlocks
              ? rawBlocks.map((b) => (b.type === 'image' ? { ...b, src: resolveSrc(b.src) } : b))
              : undefined;
            return (
              <div 
                key={item.id} 
                className={`pg-card pg-card--${size}`.trim()}
                data-id={item.id}
                data-open={openCardId === item.id ? 'true' : undefined}
                onClick={() => handleOpenCard(item.id)}
                onMouseEnter={() => handleCardHover(item.id)}
                onMouseLeave={handleCardLeave}
                style={{ cursor: 'pointer', ['--stagger-index' as any]: index } as React.CSSProperties}
              >
                <FeedDetailOverlay
                  open={openCardId === item.id}
                  onClose={handleCloseCard}
                  onAnimationPhaseChange={openCardId === item.id ? handleAnimationPhaseChange : undefined}
                  src={src}
                  sizeWhenClosed={size}
                  padding={40}
                  backgroundProps={{ 
                    pixelSize: size === 'hero' ? 80 : size === 'med' ? 70 : size === 'sm' ? 60 : 50,
                    hoverPixelToOne: true,
                    hoverPixelDuration: 500,
                    desaturateUntilHover: true,
                    objectFit: 'cover'
                  }}
                  secondaryColor={item.secondaryColor}
                  infoMaxWidth={1600}
                  infoData={{ id: item.id, heading: item.heading, date: item.date, tags: item.tags, category: item.category }}
                  primaryColor={item.primaryColor}
                  contentBlocks={resolvedBlocks}
                  use2D={size === 'xs'}
                  initialPhase={(() => {
                    const hasLoaded = loadedCardIdsRef.current.has(item.id);
                    console.log(`Card ${item.id}: hasLoaded=${hasLoaded}, loadedIds:`, Array.from(loadedCardIdsRef.current));
                    return hasLoaded ? 'ready' : 'loading';
                  })()}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;


