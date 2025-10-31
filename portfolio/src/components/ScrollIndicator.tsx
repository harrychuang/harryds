import React from 'react';
import { PixelText2D } from 'hds';
import './ScrollIndicator.scss';

interface ScrollIndicatorProps {
  scrollProgress: number; // 0-100
  primaryColor?: string;
  secondaryColor?: string;
  scrollContainer?: HTMLElement | null;
}

const ScrollIndicator: React.FC<ScrollIndicatorProps> = ({ 
  scrollProgress, 
  primaryColor,
  secondaryColor,
  scrollContainer 
}) => {
  // 計算滑塊的高度（根據滾動進度，從 0% 到 100%）
  const sliderHeightPercent = scrollProgress;
  
  // 當滾動進度超過 80% 時顯示向上箭頭
  const showTopArrow = scrollProgress > 60;
  
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
        className="scroll-indicator"
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
          text="↥"
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

