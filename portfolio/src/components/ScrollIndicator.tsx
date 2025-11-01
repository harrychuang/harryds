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
}

const ScrollIndicator: React.FC<ScrollIndicatorProps> = ({ 
  scrollProgress, 
  primaryColor,
  secondaryColor,
  scrollContainer,
  openCardId
}) => {
  const location = useLocation();

  // 計算滑塊的高度（根據滾動進度，從 0% 到 100%）
  const sliderHeightPercent = scrollProgress;
  
  // 當滾動進度超過 80% 時顯示向上箭頭
  const showTopArrow = scrollProgress > 60;
  
  // 控制彈跳動畫
  const [shouldBounce, setShouldBounce] = useState(false);
  const [hasShownArrow, setHasShownArrow] = useState(false);
  const contextKey = `${location.pathname}${location.search}|${openCardId ?? 'none'}`;
  
  // 當上下文變化時，重置狀態並將滾動位置回到頂部
  useEffect(() => {
    setHasShownArrow(false);
    setShouldBounce(false);

    const container = scrollContainer;
    if (container && typeof container.scrollTo === 'function') {
      container.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [contextKey, scrollContainer]);
  
  // 當箭頭出現時觸發動畫
  useEffect(() => {
    if (showTopArrow && !hasShownArrow) {
      setShouldBounce(true);
      setHasShownArrow(true);
      
      const timer = setTimeout(() => {
        setShouldBounce(false);
      }, 600); // 動畫總時長
      
      return () => clearTimeout(timer);
    }
  }, [showTopArrow, hasShownArrow]);
  
  // 點擊後滾動到頂部
  const handleGoToTop = () => {
    if (scrollContainer) {
      // 如果有特定的滾動容器（例如 overlay）
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // 否則滾動整個頁面
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="scroll-indicator-wrapper">
      <div 
        className={`scroll-indicator ${shouldBounce ? 'scroll-indicator--bounce' : ''}`}
        style={{
          borderColor: primaryColor || '#fff',
        }}
      >
        <div 
          className="scroll-indicator__slider"
          style={{
            backgroundColor: primaryColor || '#fff',
            height: `${sliderHeightPercent}%`,
          }}
        />
      </div>
      
      <div 
        className={`scroll-indicator__arrow ${showTopArrow ? 'scroll-indicator__arrow--visible' : ''}`}
        onClick={handleGoToTop}
        role="button"
        tabIndex={showTopArrow ? 0 : -1}
        onKeyDown={(e) => {
          if (showTopArrow && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleGoToTop();
          }
        }}
        aria-label="回到頂部"
        style={{ pointerEvents: showTopArrow ? 'auto' : 'none' }}
      >
        <PixelText2D
          text="↑"
          textEnabled
          pixelSize={2}
          width={40}
          height={40}
          primaryColor={secondaryColor}
        />
      </div>
    </div>
  );
};

export default ScrollIndicator;

