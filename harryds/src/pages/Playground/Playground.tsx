// =============================================================================
// PLAYGROUND 頁面
// =============================================================================

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import './Playground.scss';
import { FeedDetailOverlay } from '@components/FeedDetailOverlay';
import { Logo } from '@components/Logo';
import type { FeedCardSize } from '@components/FeedCard/FeedCard';
import type { FeedItem, FeedContentBlock } from '../../types/feed';
import feed from '../../../../shared/data/feed.json';
import hoverSoundUrl from '../../../assets/sound/Coin Collect Retro 8-bit Sound Effect.mp3';
import clickSoundUrl from '../../../assets/sound/8-Bit Game Start Sound.mp3';

export const Playground: React.FC = () => {
  const items = useMemo(() => (feed as any).items as FeedItem[], []);
  
  // 狀態管理：追蹤目前開啟的卡片 ID 和 hover 的卡片 ID
  const [openCardId, setOpenCardId] = useState<number | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);
  // 追蹤開啟卡片的動畫階段
  const [openCardAnimationPhase, setOpenCardAnimationPhase] = useState<'closed' | 'loading' | 'positioning' | 'expanding' | 'ready'>('closed');
  // 追蹤 Logo 是否被 hover
  const [isLogoHovered, setIsLogoHovered] = useState<boolean>(false);
  
  // 保存原始 playground 背景顏色和引用
  const originalPlaygroundBackgroundRef = useRef<string>('');
  const playgroundRef = useRef<HTMLDivElement>(null);
  
  // Logo 音效引用
  const logoHoverSoundRef = useRef<HTMLAudioElement | null>(null);
  const logoClickSoundRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedLogoHoverSoundRef = useRef<boolean>(false);
  const hasPlayedLogoClickSoundRef = useRef<boolean>(false);
  
  // 初始化：保存原始 playground 背景顏色
  useEffect(() => {
    if (!originalPlaygroundBackgroundRef.current && playgroundRef.current) {
      originalPlaygroundBackgroundRef.current = getComputedStyle(playgroundRef.current).backgroundColor || 'var(--hds-sys-color-on-theme-surface)';
    }
  }, []);
  
  // 管理 playground 背景顏色變化
  useEffect(() => {
    if (!playgroundRef.current) return;
    
    // 優先考慮正在 loading 的卡片，然後是 hover 的卡片
    const activeCardId = (openCardId && openCardAnimationPhase === 'loading') ? openCardId : (openCardId || hoveredCardId);
    if (activeCardId) {
      const activeItem = items.find(item => item.id === activeCardId);
      if (activeItem && activeItem.secondaryColor) {
        playgroundRef.current.style.backgroundColor = activeItem.secondaryColor;
        playgroundRef.current.style.transition = 'background-color 0.3s ease';
      }
    } else {
      // 恢復原始背景顏色（清空 style，回到 CSS 預設值）
      playgroundRef.current.style.backgroundColor = '';
      playgroundRef.current.style.transition = 'background-color 0.3s ease';
    }
  }, [openCardId, hoveredCardId, openCardAnimationPhase, items]);

  // 初始化 Logo hover 音效
  useEffect(() => {
    logoHoverSoundRef.current = new Audio(hoverSoundUrl);
    logoHoverSoundRef.current.preload = 'auto';
    logoHoverSoundRef.current.volume = Math.max(0, Math.min(1, 0.4)); // 設定適中音量

    const onCanPlay = () => {};
    const onError = (e: any) => {
      console.error('Logo hover sound load failed:', e);
    };

    logoHoverSoundRef.current.addEventListener('canplaythrough', onCanPlay);
    logoHoverSoundRef.current.addEventListener('error', onError);

    return () => {
      if (logoHoverSoundRef.current) {
        logoHoverSoundRef.current.removeEventListener('canplaythrough', onCanPlay);
        logoHoverSoundRef.current.removeEventListener('error', onError);
        logoHoverSoundRef.current = null;
      }
    };
  }, []);

  // 初始化 Logo click 音效
  useEffect(() => {
    logoClickSoundRef.current = new Audio(clickSoundUrl);
    logoClickSoundRef.current.preload = 'auto';
    logoClickSoundRef.current.volume = Math.max(0, Math.min(1, 0.3)); // 設定適中音量

    const onCanPlay = () => {};
    const onError = (e: any) => {
      console.error('Logo click sound load failed:', e);
    };

    logoClickSoundRef.current.addEventListener('canplaythrough', onCanPlay);
    logoClickSoundRef.current.addEventListener('error', onError);

    return () => {
      if (logoClickSoundRef.current) {
        logoClickSoundRef.current.removeEventListener('canplaythrough', onCanPlay);
        logoClickSoundRef.current.removeEventListener('error', onError);
        logoClickSoundRef.current = null;
      }
    };
  }, []);

  // Logo 音效播放函數
  const playLogoHoverSound = useCallback(async () => {
    if (!logoHoverSoundRef.current || hasPlayedLogoHoverSoundRef.current) return;
    // 只在 back 狀態時播放
    if (!(openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready'))) return;
    
    try {
      logoHoverSoundRef.current.currentTime = 0;
      await logoHoverSoundRef.current.play();
      hasPlayedLogoHoverSoundRef.current = true;
    } catch (err) {
      console.warn('Logo hover sound play failed:', err);
    }
  }, [openCardId, openCardAnimationPhase]);

  const playLogoClickSound = useCallback(async () => {
    if (!logoClickSoundRef.current || hasPlayedLogoClickSoundRef.current) return;
    // 只在 back 狀態時播放
    if (!(openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready'))) return;
    
    try {
      logoClickSoundRef.current.currentTime = 0;
      await logoClickSoundRef.current.play();
      hasPlayedLogoClickSoundRef.current = true;
    } catch (err) {
      console.warn('Logo click sound play failed:', err);
    }
  }, [openCardId, openCardAnimationPhase]);

  // Logo hover 處理函數
  const handleLogoHover = useCallback(() => {
    // 只在 back 狀態時設置 hover 狀態和播放音效
    if (openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready')) {
      setIsLogoHovered(true);
      // 重置播放狀態並播放 hover 音效
      hasPlayedLogoHoverSoundRef.current = false;
      playLogoHoverSound();
    }
  }, [playLogoHoverSound, openCardId, openCardAnimationPhase]);

  // Logo hover 離開處理函數
  const handleLogoLeave = useCallback(() => {
    setIsLogoHovered(false);
  }, []);

  // 開啟卡片的處理函數
  const handleOpenCard = useCallback((cardId: number) => {
    setOpenCardId(cardId);
  }, []);
  
  // 關閉卡片的處理函數
  const handleCloseCard = useCallback(() => {
    setOpenCardId(null);
    setOpenCardAnimationPhase('closed');
    setHoveredCardId(null); // 重置 hover 狀態，確保 Logo 完全回到預設狀態
    setIsLogoHovered(false); // 重置 Logo hover 狀態
    
    // 重置 Logo 音效播放狀態
    hasPlayedLogoHoverSoundRef.current = false;
    hasPlayedLogoClickSoundRef.current = false;
    
    // 停止播放中的音效
    if (logoHoverSoundRef.current) {
      logoHoverSoundRef.current.pause();
      logoHoverSoundRef.current.currentTime = 0;
    }
    if (logoClickSoundRef.current) {
      logoClickSoundRef.current.pause();
      logoClickSoundRef.current.currentTime = 0;
    }
  }, []);

  // Logo click 處理函數（結合原有的關閉功能）
  const handleLogoClick = useCallback(() => {
    // 重置播放狀態並播放 click 音效
    hasPlayedLogoClickSoundRef.current = false;
    playLogoClickSound();
    
    // 執行原有的關閉功能，延遲一下讓音效有時間播放
    if (openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready')) {
      setTimeout(() => {
        handleCloseCard();
      }, 500); // 500ms 延遲，讓音效有足夠時間播放
    }
  }, [playLogoClickSound, openCardId, openCardAnimationPhase, handleCloseCard]);
  
  // 動畫階段變化處理函數
  const handleAnimationPhaseChange = useCallback((phase: 'closed' | 'loading' | 'positioning' | 'expanding' | 'ready') => {
    setOpenCardAnimationPhase(phase);
  }, []);
  
  // Hover 處理函數
  const handleCardHover = useCallback((cardId: number) => {
    if (openCardId) return; // 如果有卡片開啟，忽略 hover
    setHoveredCardId(cardId);
  }, [openCardId]);
  
  const handleCardLeave = useCallback(() => {
    setHoveredCardId(null);
  }, []);

  // 計算 Logo 應該使用的顏色（開啟狀態優先於 hover 狀態）
  const logoColors = useMemo(() => {
    // 只有在有 hover 或 open 狀態時才使用自訂顏色
    const activeCardId = openCardId || hoveredCardId;
    if (activeCardId) {
      const activeItem = items.find(item => item.id === activeCardId);
      if (activeItem && activeItem.primaryColor && activeItem.secondaryColor) {
        return {
          primaryColor: activeItem.primaryColor,
          secondaryColor: activeItem.secondaryColor,
        };
      }
    }
    // 確保回到預設狀態時不傳遞任何顏色 props，讓 Logo 使用預設值
    return {};
  }, [openCardId, hoveredCardId, items]);

  // 為 Logo 創建穩定的 key，確保在狀態切換時能正確重新掛載動畫
  const logoKey = useMemo(() => {
    const logoType = openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready') ? 'back' : 'default';
    const hasCustomColors = openCardId || hoveredCardId;
    const isAnimated = logoType === 'back' ? isLogoHovered : true;
    return `${logoType}-${hasCustomColors ? 'custom' : 'default'}-${isAnimated ? 'animated' : 'static'}`;
  }, [openCardId, hoveredCardId, openCardAnimationPhase, isLogoHovered]);

  const getSizeByIndex = (index: number): FeedCardSize => {
    if (index === 0) return 'hero';
    if (index <= 2) return 'med'; // 1,2
    if (index <= 5) return 'sm';  // 3,4,5
    return 'xs';                  // 6,7,8
  };

  // 以 Vite 的 import.meta.glob 建立靜態資產映射，確保開發與打包皆可正確解析
  const imageModules = useMemo(() => (
    import.meta.glob('../../../assets/imgs/**/*', { eager: true, import: 'default' }) as Record<string, string>
  ), []);

  const resolveSrc = (fileName?: string) => {
    if (!fileName) return '';
    const key = `../../../assets/imgs/${fileName}`;
    if (imageModules[key]) return imageModules[key];
    // 後備：若沒有命中（理論上不會），回退相對 URL 解析
    return new URL(`../../../assets/imgs/${fileName}`, import.meta.url).href;
  };

  return (
    <div ref={playgroundRef} className="playground">
      <header className="playground__header">
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
      <div className="playground__container">
        <div className="playground__content">
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
                onClick={() => handleOpenCard(item.id)}
                onMouseEnter={() => handleCardHover(item.id)}
                onMouseLeave={handleCardLeave}
                style={{ 
                  cursor: 'pointer',
                  opacity: (() => {
                    // 如果有卡片正在 loading，只有該卡片保持不透明，其他都變透明
                    if (openCardId && openCardAnimationPhase === 'loading') {
                      return openCardId === item.id ? 1 : 0.2;
                    }
                    // 一般 hover 邏輯
                    return hoveredCardId && hoveredCardId !== item.id ? 0.2 : 1;
                  })(),
                  transition: 'opacity 0.3s ease'
                }}
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
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Playground;
