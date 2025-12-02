// =============================================================================
// HARRY DESIGN SYSTEM - 元件匯出
// =============================================================================

// PixelText - 8-bit 風格像素文字元件
export { PixelText, PixelText2D } from './PixelText';
export type { PixelTextProps } from './PixelText';

// 當有新元件時，在此處匯出
// 例如：
// export { Button } from './Button';
// export type { ButtonProps } from './Button';

// FeedCard - 以 PixelationImg 作為背景的卡片
export { FeedCard } from './FeedCard';
export type { FeedCardProps, FeedCardSize } from './FeedCard';
export { FeedCardInfo } from './FeedCard';
export type { FeedCardInfoProps } from './FeedCard';

// Logo - 品牌標誌元件（使用 PixelText）
export { Logo } from './Logo';
export type { LogoProps } from './Logo';

// DistortedPixels - 響應滾動的扭曲像素化圖片元件
export { DistortedPixels, DistortedPixels2D } from './DistortedPixels';
export type { DistortedPixelsProps, DistortedPixelsObjectFit } from './DistortedPixels';

// FeedDetailOverlay - 放大檢視（FeedCard hero + 內容）
export { FeedDetailOverlay } from './FeedDetailOverlay';
export type { FeedDetailOverlayProps } from './FeedDetailOverlay';

// VideoPlayer - 支援現代影片播放功能的元件
export { VideoPlayer } from './VideoPlayer';
export type { VideoPlayerProps } from './VideoPlayer';

// CTAButton - 帶有動畫條紋背景的 Call-to-Action 按鈕
export { CTAButton } from './CTAButton';
export type { CTAButtonProps } from './CTAButton';

// HarryAnimation - 循環播放圖片序列形成動畫效果
export { HarryAnimation } from './HarryAnimation';
export type { HarryAnimationProps, HarryAnimationType } from './HarryAnimation';

// ListCard - 推薦人卡片元件
export { ListCard } from './ListCard';
export type { ListCardProps } from './ListCard';

// ParticlesBackground - Canvas 背景粒子效果
export { ParticlesBackground } from './ParticlesBackground';
export type { ParticlesBackgroundProps } from './ParticlesBackground';

// PixelLoading - 8-bit 風格像素進度條
export { PixelLoading } from './PixelLoading';
export type { PixelLoadingProps } from './PixelLoading';

// PixelationImg - 優化的像素化圖片元件（支援多實例）
export { PixelationImg, PixelationManager } from './PixelationImg';
export type { PixelationImgProps, PixelationImgObjectFit, PixelationInstance } from './PixelationImg';

// Input - 深色主題輸入框元件
export { Input } from './Input';
export type { InputProps } from './Input';

// Dropdown - 深色主題下拉選單元件
export { Dropdown } from './Dropdown';
export type { DropdownProps, DropdownOption } from './Dropdown';

// PopupModal - 深色主題彈出視窗元件
export { PopupModal } from './PopupModal';
export type { PopupModalProps } from './PopupModal';

// Button - 深色主題按鈕元件
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

// PixelIcon - 8-bit 風格圖示元件
export { PixelIcon } from './PixelIcon';
export type { PixelIconProps } from './PixelIcon';