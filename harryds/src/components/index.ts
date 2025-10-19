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
export { PixelImage, PixelImage2D } from './PixelImage';
export type { PixelImageProps, PixelImageObjectFit } from './PixelImage';
// FeedCard - 以 PixelImage 作為背景的卡片
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