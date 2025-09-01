// =============================================================================
// PLAYGROUND 頁面
// =============================================================================

import React, { useMemo, useState, useCallback } from 'react';
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
  
  // 開啟卡片的處理函數
  const handleOpenCard = useCallback((cardId: number) => {
    setOpenCardId(cardId);
  }, []);
  
  // 關閉卡片的處理函數
  const handleCloseCard = useCallback(() => {
    setOpenCardId(null);
    setOpenCardAnimationPhase('closed');
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
  const getLogoColors = useCallback(() => {
    const activeCardId = openCardId || hoveredCardId;
    if (activeCardId) {
      const activeItem = items.find(item => item.id === activeCardId);
      if (activeItem) {
        return {
          primaryColor: activeItem.primaryColor,
          secondaryColor: activeItem.secondaryColor,
        };
      }
    }
    return {}; // 使用 Logo 組件的預設顏色
  }, [openCardId, hoveredCardId, items]);

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
    <div className="playground">
      <header className="playground__header">
        <div className="header-content">
          <div 
            onClick={openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready') ? handleCloseCard : undefined}
            style={{ cursor: openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready') ? 'pointer' : 'default' }}
          >
            <Logo 
              type={openCardId && (openCardAnimationPhase === 'expanding' || openCardAnimationPhase === 'ready') ? 'back' : 'default'}
              {...getLogoColors()}
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
                style={{ cursor: 'pointer' }}
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
