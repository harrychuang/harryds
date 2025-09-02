// =============================================================================
// LOGO 元件 - 使用 PixelText2D 建立品牌標誌
// - 主文字：Harry
// - Text-box：跑馬燈顯示完整資訊
// - 使用 Canvas2D 版本避免 WebGL context 限制
// =============================================================================

import { forwardRef } from 'react';
import { PixelText2D } from '../PixelText';
import { HDS_TOKENS } from '../../utils/colorTokens';

export type LogoType = 'default' | 'back';

export interface LogoProps {
  /** Logo 類型 */
  type?: LogoType;
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
  type = 'default',
  primaryColor = HDS_TOKENS.themeSurface,
  secondaryColor = HDS_TOKENS.onThemeSurface,
  animated = true,
  marqueeEnabled = true,
  className = '',
}, ref) => {
  // 根據 type 設定不同的內容和配置
  const getLogoConfig = () => {
    switch (type) {
      case 'back':
        return {
          logoText: "BACK",
          logoTextBox: "<",
          swapTextAndBox: true,
          width: 210, // Back 比較短，調整寬度（考慮額外間距）
          height: 40,
        };
      case 'default':
      default:
        return {
          logoText: "HARRY",
          logoTextBox: "CHUANG ▲●◼ DESIGN STUDIO ▲●◼ DESIGN SYSTEM ▲●◼ HELLO~ WELCOME! ▲●◼ ",
          swapTextAndBox: false,
          width: 350,
          height: 40,
        };
    }
  };

  const config = getLogoConfig();

  return (
    <div
      ref={ref}
      className={`logo ${className}`.trim()}
      style={{
        display: 'inline-block',
        position: 'relative',
      }}
    >
      <PixelText2D
        key={`logo-${type}-${config.width}-${config.height}`} // 強制重新創建實例以確保尺寸正確更新
        text={config.logoText}
        textEnabled={true}
        textBoxEnabled={true}
        textBox={config.logoTextBox}
        textBoxWidth={type === 'back' ? 1 : 4}
        textBoxPadding={type === 'back' ? 1 : 2}
        swapTextAndBox={config.swapTextAndBox}
        primaryColor={primaryColor}
        onPrimaryColor={secondaryColor}
        pixelSize={4}
        pixelGap={0}
        letterSpacing={1}
        animated={animated}
        marqueeEnabled={type === 'back' ? false : marqueeEnabled} // Back 類型不需要跑馬燈
        marqueeSpeed={15}
        marqueePause={0}
        width={config.width}
        height={config.height}
        totalAnimationDuration={1000}
        durationTime={500}
        animationDelay={0}
        easeGlitch={false}
      />
    </div>
  );
});

Logo.displayName = 'Logo';

export default Logo;
