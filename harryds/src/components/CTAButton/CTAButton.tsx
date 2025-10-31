// =============================================================================
// CTA BUTTON 元件
// - 帶有動畫條紋背景的 Call-to-Action 按鈕
// - 12 個條紋方塊循環顯示主色與副色
// - Hover 時加速動畫效果
// =============================================================================

import React from 'react';
import './CTAButton.scss';
import iconLinkUrl from '../../../assets/imgs/icon/icon-link.svg';

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
  // 判斷是否為深色文字（用於圖示反轉）
  const isLightIcon = textColor?.toLowerCase().includes('fff') || 
                       textColor?.toLowerCase().includes('255') ||
                       textColor?.toLowerCase().includes('white');
  
  return (
    <a 
      href={href}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className={`cta-button ${className}`.trim()}
      onClick={onClick}
      style={{
        '--cta-text-color': textColor,
        '--cta-icon-invert': isLightIcon ? '1' : '0',
      } as React.CSSProperties}
    >
      <div 
        className="cta-button__background"
        style={{
          '--cta-primary': primaryColor,
          '--cta-secondary': secondaryColor,
        } as React.CSSProperties}
      >
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
        <img 
          src={iconUrl} 
          alt="" 
          className="cta-button__icon"
        />
        <span className="cta-button__text">
          {label}
        </span>
      </span>
    </a>
  );
};

export default CTAButton;

