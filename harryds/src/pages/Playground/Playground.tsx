// =============================================================================
// PLAYGROUND 頁面
// =============================================================================

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import './Playground.scss';
import { FeedDetailOverlay } from '@components/FeedDetailOverlay';
import { Logo } from '@components/Logo';
import type { FeedCardSize } from '@components/FeedCard/FeedCard';
import type { FeedItem } from '../../types/feed';
import feed from '../../../../shared/data/feed.json';

export const Playground: React.FC = () => {
  const items = useMemo(() => (feed as any).items as FeedItem[], []);
  
  // 狀態管理：追蹤目前開啟的卡片 ID 和 hover 的卡片 ID
  const [openCardId, setOpenCardId] = useState<number | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);
  // 追蹤開啟卡片的動畫階段
  const [openCardAnimationPhase, setOpenCardAnimationPhase] = useState<'closed' | 'loading' | 'positioning' | 'expanding' | 'ready'>('closed');
  
  // 保存原始 playground 背景顏色和引用
  const originalPlaygroundBackgroundRef = useRef<string>('');
  const playgroundRef = useRef<HTMLDivElement>(null);
  
  // 初始化：保存原始 playground 背景顏色
  useEffect(() => {
    if (!originalPlaygroundBackgroundRef.current && playgroundRef.current) {
      originalPlaygroundBackgroundRef.current = getComputedStyle(playgroundRef.current).backgroundColor || 'var(--hds-sys-color-on-theme-surface)';
    }
  }, []);
  
  // 管理 playground 背景顏色變化
  useEffect(() => {
    if (!playgroundRef.current) return;
    
    const activeCardId = openCardId || hoveredCardId;
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
  }, [openCardId, hoveredCardId, items]);
  
  // 開啟卡片的處理函數
  const handleOpenCard = useCallback((cardId: number) => {
    setOpenCardId(cardId);
  }, []);
  
  // 關閉卡片的處理函數
  const handleCloseCard = useCallback(() => {
    setOpenCardId(null);
    setOpenCardAnimationPhase('closed');
    setHoveredCardId(null); // 重置 hover 狀態，確保 Logo 完全回到預設狀態
  }, []);
  
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
    return `${logoType}-${hasCustomColors ? 'custom' : 'default'}`;
  }, [openCardId, hoveredCardId, openCardAnimationPhase]);

  const getSizeByIndex = (index: number): FeedCardSize => {
    if (index === 0) return 'hero';
    if (index <= 2) return 'med'; // 1,2
    if (index <= 5) return 'sm';  // 3,4,5
    return 'xs';                  // 6,7,8
  };

  const resolveSrc = (fileName?: string) => {
    if (!fileName) return '';
    return new URL(`../../../assets/imgs/${fileName}`, import.meta.url).href;
  };

  return (
    <div ref={playgroundRef} className="playground">
      <header className="playground__header">
        <div className="header-content">
          <div 
            onClick={openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready') ? handleCloseCard : undefined}
            style={{ 
              cursor: openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready') ? 'pointer' : 'default',
              transform: openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready') ? 'translateX(-10px)' : 'translateX(0px)',
              transition: 'transform 0.3s ease'
            }}
          >
            <Logo 
              key={logoKey}
              type={openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready') ? 'back' : 'default'}
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
            return (
              <div 
                key={item.id} 
                className={`pg-card pg-card--${size}`.trim()}
                onClick={() => handleOpenCard(item.id)}
                onMouseEnter={() => handleCardHover(item.id)}
                onMouseLeave={handleCardLeave}
                style={{ 
                  cursor: 'pointer',
                  opacity: hoveredCardId && hoveredCardId !== item.id ? 0.2 : 1,
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
