import React, { useEffect, useRef, useState } from 'react';
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
  arrowClassName?: string;
  bounceDelayMs?: number;
  sliderMultiplier?: number;
  sliderOffset?: number;
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
  arrowClassName,
  bounceDelayMs = 0,
  sliderMultiplier = 1,
  sliderOffset = 0,
}) => {
  const location = useLocation();

  // 計算調整後的進度
  const adjustedProgress = Math.min(100, Math.max(0, scrollProgress * sliderMultiplier + sliderOffset));
  const sliderHeightPercent = scrollProgress >= 100 ? 100 : adjustedProgress;

  // 當調整後的進度超過 60% 時顯示圖示
  const showIcon = sliderHeightPercent > 60;
  
  // 控制彈跳動畫
  const [shouldBounce, setShouldBounce] = useState(false);
  const [hasShownIcon, setHasShownIcon] = useState(false);
  const contextKey = `${location.pathname}${location.search}|${openCardId ?? 'none'}`;
  const bounceStartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bounceEndTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 當上下文變化時，重置狀態並將滾動位置回到頂部（若需要）
  useEffect(() => {
    if (bounceStartTimerRef.current) {
      clearTimeout(bounceStartTimerRef.current);
      bounceStartTimerRef.current = null;
    }
    if (bounceEndTimerRef.current) {
      clearTimeout(bounceEndTimerRef.current);
      bounceEndTimerRef.current = null;
    }
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
      setHasShownIcon(true);
      if (bounceStartTimerRef.current) {
        clearTimeout(bounceStartTimerRef.current);
      }
      if (bounceEndTimerRef.current) {
        clearTimeout(bounceEndTimerRef.current);
      }

      bounceStartTimerRef.current = setTimeout(() => {
        setShouldBounce(true);
        bounceEndTimerRef.current = setTimeout(() => {
          setShouldBounce(false);
          bounceEndTimerRef.current = null;
        }, 600);
      }, bounceDelayMs);
    }
  }, [showIcon, hasShownIcon, bounceDelayMs]);

  // 清理計時器
  useEffect(() => () => {
    if (bounceStartTimerRef.current) {
      clearTimeout(bounceStartTimerRef.current);
    }
    if (bounceEndTimerRef.current) {
      clearTimeout(bounceEndTimerRef.current);
    }
  }, []);
  
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

  const arrowClasses = [
    'scroll-indicator__arrow',
    showIcon ? 'scroll-indicator__arrow--visible' : '',
    arrowClassName || '',
  ].filter(Boolean).join(' ');

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
        className={arrowClasses}
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
        style={{ pointerEvents: showIcon ? 'auto' : 'none' }}
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

