import React, { useEffect, useState } from 'react';
import { PixelText2D } from 'hds';
import { useLocation } from 'react-router-dom';
import './ScrollIndicator.scss';

interface ScrollIndicatorProps {
  scrollProgress: number; // 0-100
  primaryColor?: string;
  secondaryColor?: string;
  scrollContainer?: HTMLElement | null;
  openCardId?: number | null; // 用於檢測進入 detail page
  icon?: string;
  iconAriaLabel?: string;
  enableScrollToTop?: boolean;
  onIconClick?: () => void;
}

const ScrollIndicator: React.FC<ScrollIndicatorProps> = ({ 
  scrollProgress, 
  primaryColor,
  secondaryColor,
  scrollContainer,
  openCardId,
  icon = '↑',
  iconAriaLabel,
  enableScrollToTop = true,
  onIconClick,
}) => {
  const location = useLocation();

  // 計算滑塊的高度（根據滾動進度，從 0% 到 100%）
  const sliderHeightPercent = scrollProgress;
  
  // 當滾動進度超過 60% 時顯示圖示
  const showIcon = scrollProgress > 60;
  
  // 控制彈跳動畫
  const [shouldBounce, setShouldBounce] = useState(false);
  const [hasShownIcon, setHasShownIcon] = useState(false);
  const contextKey = `${location.pathname}${location.search}|${openCardId ?? 'none'}`;
  
  // 當上下文變化時，重置狀態並將滾動位置回到頂部（若需要）
  useEffect(() => {
    setHasShownIcon(false);
    setShouldBounce(false);

    if (enableScrollToTop) {
      const container = scrollContainer;
      if (container && typeof container.scrollTo === 'function') {
        container.scrollTo({ top: 0, behavior: 'auto' });
      } else {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    }
  }, [contextKey, scrollContainer, enableScrollToTop]);
  
  // 當圖示出現時觸發動畫
  useEffect(() => {
    if (showIcon && !hasShownIcon) {
      setShouldBounce(true);
      setHasShownIcon(true);
      
      const timer = setTimeout(() => {
        setShouldBounce(false);
      }, 600); // 動畫總時長
      
      return () => clearTimeout(timer);
    }
  }, [showIcon, hasShownIcon]);
  
  const handleIconClick = () => {
    if (!showIcon) return;

    if (onIconClick) {
      onIconClick();
      return;
    }

    if (enableScrollToTop) {
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const resolvedPrimaryColor = primaryColor || '#fff';
  const resolvedSecondaryColor = secondaryColor || 'var(--on-hds-sys-color-theme-surface)';
  const ariaLabel = iconAriaLabel || (enableScrollToTop ? '回到頂部' : 'icon');

  return (
    <div className="scroll-indicator-wrapper">
      <div 
        className={`scroll-indicator ${shouldBounce ? 'scroll-indicator--bounce' : ''}`}
        style={{
          borderColor: resolvedPrimaryColor,
        }}
      >
        <div 
          className="scroll-indicator__slider"
          style={{
            backgroundColor: resolvedPrimaryColor,
            height: `${sliderHeightPercent}%`,
          }}
        />
      </div>
      
      <div 
        className={`scroll-indicator__arrow ${showIcon ? 'scroll-indicator__arrow--visible' : ''}`}
        onClick={handleIconClick}
        role="button"
        tabIndex={showIcon ? 0 : -1}
        onKeyDown={(e) => {
          if (showIcon && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleIconClick();
          }
        }}
        aria-label={ariaLabel}
        style={{ pointerEvents: showIcon && (enableScrollToTop || onIconClick) ? 'auto' : 'none' }}
      >
        <PixelText2D
          text={icon}
          textEnabled
          pixelSize={2}
          width={40}
          height={40}
          primaryColor={resolvedSecondaryColor}
        />
      </div>
    </div>
  );
}

export default ScrollIndicator;

