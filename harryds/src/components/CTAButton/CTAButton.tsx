// =============================================================================
// CTA BUTTON 元件
// - 帶有動畫條紋背景的 Call-to-Action 按鈕
// - 12 個條紋方塊循環顯示主色與副色
// - Hover 時加速動畫效果
// =============================================================================

import React, { useState, useCallback, useEffect } from 'react';
import './CTAButton.scss';

// 內嵌 SVG 作為 Data URL，確保在所有環境都能正確顯示
// 原始 SVG: harryds/assets/imgs/icon/icon-link.svg
const iconLinkUrl = 'data:image/svg+xml,%3Csvg%20width%3D%2222%22%20height%3D%2222%22%20viewBox%3D%220%200%2022%2022%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M15%209H16V16H15V17H14V18H13V19H12V20H11V21H10V22H4V21H3V20H2V19H1V18H0V13H1V12H2V11H3V10H4V14H3V17H4V18H5V19H8V18H9V17H10V16H11V15H12V14H13V11H12V10H11V9H12V8H13V7H14V8H15V9Z%22%20fill%3D%22white%22%2F%3E%3Cpath%20d%3D%22M22%204V9H21V10H20V11H19V12H18V8H19V5H18V4H17V3H14V4H13V5H12V6H11V7H10V8H9V11H10V12H11V13H10V14H9V15H8V14H7V13H6V6H7V5H8V4H9V3H10V2H11V1H12V0H18V1H19V2H20V3H21V4H22Z%22%20fill%3D%22white%22%2F%3E%3C%2Fsvg%3E';

// 檢測設備是否支援 hover（非觸控設備）
const getHasHoverCapability = (): boolean => {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(hover: hover)').matches;
};

export interface CTAButtonProps {
  /** 按鈕文字 */
  label?: string;
  /** 連結 URL */
  href: string;
  /** 主色（條紋背景色 1） */
  primaryColor?: string;
  /** 副色（條紋背景色 2） */
  secondaryColor?: string;
  /** 文字顏色（根據背景色自動判斷亮色或暗色） */
  textColor?: string;
  /** 圖示 URL（預設使用內建的 link icon） */
  iconUrl?: string;
  /** 是否在新視窗開啟 */
  target?: '_blank' | '_self' | '_parent' | '_top';
  /** 額外的 CSS 類名 */
  className?: string;
  /** 點擊事件（可選） */
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const CTAButton: React.FC<CTAButtonProps> = ({
  label = 'VISIT WEBSITE',
  href,
  primaryColor = '#000',
  secondaryColor = '#333',
  textColor = '#fff',
  iconUrl = iconLinkUrl,
  target = '_blank',
  className = '',
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hasHover, setHasHover] = useState(getHasHoverCapability);

  // 監聽 hover 能力變化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover)');
    const handleChange = (e: MediaQueryListEvent) => setHasHover(e.matches);
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Touch 事件處理（觸控設備模擬 hover 效果）
  const handleTouchStart = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsHovered(false);
  }, []);

  return (
    <a 
      href={href}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className={`cta-button ${className}`.trim()}
      onClick={onClick}
      data-hovered={isHovered ? 'true' : undefined}
      // 觸控設備：使用 touch 事件模擬 hover
      onTouchStart={!hasHover ? handleTouchStart : undefined}
      onTouchEnd={!hasHover ? handleTouchEnd : undefined}
      onTouchCancel={!hasHover ? handleTouchEnd : undefined}
      style={{
        '--cta-text-color': textColor,
        '--cta-primary': primaryColor,
        '--cta-secondary': secondaryColor,
      } as React.CSSProperties}
    >
      <div className="cta-button__background">
        {/* 12個方塊背景 - 顏色會循環移動 */}
        <div className="cta-button__stripe" data-stripe="1" />
        <div className="cta-button__stripe" data-stripe="2" />
        <div className="cta-button__stripe" data-stripe="3" />
        <div className="cta-button__stripe" data-stripe="4" />
        <div className="cta-button__stripe" data-stripe="5" />
        <div className="cta-button__stripe" data-stripe="6" />
        <div className="cta-button__stripe" data-stripe="7" />
        <div className="cta-button__stripe" data-stripe="8" />
        <div className="cta-button__stripe" data-stripe="9" />
        <div className="cta-button__stripe" data-stripe="10" />
        <div className="cta-button__stripe" data-stripe="11" />
        <div className="cta-button__stripe" data-stripe="12" />
      </div>
      <span className="cta-button__content">
        {/* 使用 div + mask 替代 img，這樣可以用 background-color 設定顏色 */}
        <span 
          className="cta-button__icon"
          style={{
            maskImage: `url(${iconUrl})`,
            WebkitMaskImage: `url(${iconUrl})`,
          } as React.CSSProperties}
        />
        <span className="cta-button__text">
          {label}
        </span>
      </span>
    </a>
  );
};

export default CTAButton;

