import React, { CSSProperties, useEffect, useRef, useState, useCallback } from 'react';
import { PixelText2D } from 'hds';
import { useLocation } from 'react-router-dom';
import './ScrollIndicator.scss';

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  bgX: number;
  bgY: number;
};

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
  iconClassName?: string;
  bounceDelayMs?: number;
  sliderMultiplier?: number;
  sliderOffset?: number;
  disableProgress?: boolean;
  forceShowIcon?: boolean;
  isLiked?: boolean;
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
  iconClassName,
  bounceDelayMs = 0,
  sliderMultiplier = 1,
  sliderOffset = 0,
  disableProgress = false,
  forceShowIcon = false,
  isLiked = false,
}) => {
  const location = useLocation();

  // 計算調整後的進度
  const adjustedProgress = Math.min(100, Math.max(0, scrollProgress * sliderMultiplier + sliderOffset));
  const sliderHeightPercent = scrollProgress >= 100 ? 100 : adjustedProgress;
  const resolvedSliderHeightPercent = disableProgress ? 100 : sliderHeightPercent;

  // 當調整後的進度超過 60% 時顯示圖示
  const showIcon = forceShowIcon || isLiked || resolvedSliderHeightPercent > 60;
  
  // 控制彈跳動畫
  const [shouldBounce, setShouldBounce] = useState(false);
  const [hasShownIcon, setHasShownIcon] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const contextKey = `${location.pathname}${location.search}|${openCardId ?? 'none'}`;
  const bounceStartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bounceEndTimerRef = useRef<NodeJS.Timeout | null>(null);
  const particleIdRef = useRef(0);
  const particleTimeoutsRef = useRef<number[]>([]);
  
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

  // 清理粒子計時器
  useEffect(() => () => {
    particleTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    particleTimeoutsRef.current = [];
  }, []);
  
  const handleIconClick = () => {
    if (!showIcon) return;

    // 觸發煙火效果：heart 按鈕在未 liked 時，或 arrow 按鈕在 scrollToTop 時
    const shouldSpawnParticles = 
      (!isLiked && isHeartIcon) || // heart 按鈕且未 liked
      (enableScrollToTop && !isHeartIcon); // go to top 按鈕
    
    if (shouldSpawnParticles) {
      spawnParticles();
    }

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

  const isHeartIcon = iconClassName?.includes('scroll-indicator__icon--heart');

  // 產生煙火粒子效果
  const spawnParticles = useCallback(() => {
    const count = Math.floor(Math.random() * 30) + 30;
    const newParticles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 50;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const size = 4 + Math.random() * 6;
      const duration = 450 + Math.random() * 400;
      const delay = Math.random() * 120;
      const bgX = Math.random() * 100;
      const bgY = Math.random() * 100;
      const id = particleIdRef.current++;

      newParticles.push({ id, x, y, size, duration, delay, bgX, bgY });
    }

    setParticles((prev) => [...prev, ...newParticles]);

    newParticles.forEach((particle) => {
      const timeoutId = window.setTimeout(() => {
        setParticles((prev) => prev.filter((item) => item.id !== particle.id));
        particleTimeoutsRef.current = particleTimeoutsRef.current.filter((value) => value !== timeoutId);
      }, particle.duration + particle.delay);

      particleTimeoutsRef.current.push(timeoutId);
    });
  }, []);

  const sliderClasses = [
    'scroll-indicator__slider',
    disableProgress ? 'scroll-indicator__slider--locked' : '',
    isLiked ? 'scroll-indicator__slider--liked' : '',
  ].filter(Boolean).join(' ');

  const sliderStyle: CSSProperties = {
    height: `${resolvedSliderHeightPercent}%`,
  };

  if (isLiked) {
    sliderStyle.background = 'var(--noeinoi-rainbow-gradient)';
  } else {
    sliderStyle.backgroundColor = resolvedPrimaryColor;
  }

  const iconClasses = [
    'scroll-indicator__icon',
    showIcon ? 'scroll-indicator__icon--visible' : '',
    iconClassName || '',
    isLiked ? 'scroll-indicator__icon--liked' : '',
    !isLiked && isHeartIcon ? 'scroll-indicator__icon--heart-active' : '',
  ].filter(Boolean).join(' ');

  const indicatorClasses = [
    'scroll-indicator',
    shouldBounce ? 'scroll-indicator--bounce' : '',
    isLiked ? 'scroll-indicator--liked' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="scroll-indicator-wrapper">
      <div 
        className={indicatorClasses}
        style={{
          borderColor: resolvedPrimaryColor,
        }}
      >
        <div 
          className={sliderClasses}
          style={sliderStyle}
        />
      </div>
      
      <div 
        className={iconClasses}
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
        <span className="scroll-indicator__icon-inner">
          <PixelText2D
            text={icon}
            textEnabled
            pixelSize={2}
            width={isLiked ? 50 : 40}
            height={isLiked ? 50 : 40}
            primaryColor={isLiked ? '#ffffff' : resolvedSecondaryColor}
          />
        </span>
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="scroll-indicator__particle"
            style={
              {
                '--particle-x': `${particle.x}px`,
                '--particle-y': `${particle.y}px`,
                '--particle-size': `${particle.size}px`,
                '--particle-delay': `${particle.delay}ms`,
                '--particle-duration': `${particle.duration}ms`,
                '--particle-bg-x': `${particle.bgX}%`,
                '--particle-bg-y': `${particle.bgY}%`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}

export default ScrollIndicator;

