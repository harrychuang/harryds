// =============================================================================
// LOGO 元件 - 使用 PixelText 建立品牌標誌
// - 主文字：Harry
// - Text-box：跑馬燈顯示完整資訊
// =============================================================================

import { forwardRef } from 'react';
import { PixelText } from '../PixelText';
import { HDS_TOKENS } from '../../utils/colorTokens';

export interface LogoProps {
  /** 主色調（主文字顏色 & text-box 背景色） */
  primaryColor?: string;
  /** 次色調（text-box 文字顏色） */
  secondaryColor?: string;
  /** 是否啟用動畫效果 */
  animated?: boolean;
  /** 是否啟用跑馬燈效果 */
  marqueeEnabled?: boolean;
  /** 額外的 CSS 類名 */
  className?: string;
}

export const Logo = forwardRef<HTMLDivElement, LogoProps>(({
  primaryColor = HDS_TOKENS.themeSurface,
  secondaryColor = HDS_TOKENS.onThemeSurface,
  animated = true,
  marqueeEnabled = true,
  className = '',
}, ref) => {
  const logoText = "HARRY";
  const logoTextBox = "CHUANG ▲●◼ DESIGN STUDIO ▲●◼ DESIGN SYSTEM ▲●◼ HELLO~ WELCOME! ▲●◼ ";
  
  // 自動計算 Logo 尺寸
  // 主文字 "HARRY" (5字符): 5 * 8 * 4 + 4 * 1 * 4 = 176px
  // TextBox (4字符寬度 + padding): 4 * 8 * 4 + 3 * 1 * 4 + 8 + 4 = 152px  
  // 間距: 2 * 4 = 8px
  // 總寬度: 176 + 8 + 152 = 336px，設為 350px 預留空間
  // 總高度: 8 * 4 = 32px，設為 40px 預留空間
  const logoWidth = 350;
  const logoHeight = 40;

  return (
    <div
      ref={ref}
      className={`logo ${className}`.trim()}
      style={{
        display: 'inline-block',
        position: 'relative',
      }}
    >
      <PixelText
        text={logoText}
        textEnabled={true}
        textBoxEnabled={true}
        textBox={logoTextBox}
        textBoxWidth={4}
        textBoxPadding={2}
        primaryColor={primaryColor}
        onPrimaryColor={secondaryColor}
        pixelSize={4}
        pixelGap={0}
        letterSpacing={1}
        animated={animated}
        marqueeEnabled={marqueeEnabled}
        marqueeSpeed={15}
        marqueePause={0}
        width={logoWidth}
        height={logoHeight}
        totalAnimationDuration={1500}
        durationTime={600}
        animationDelay={120}
        easeGlitch={true}
      />
    </div>
  );
});

Logo.displayName = 'Logo';

export default Logo;
