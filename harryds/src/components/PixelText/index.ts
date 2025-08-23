// =============================================================================
// PIXEL TEXT 匯出 - 8-bit 風格文字元件
// =============================================================================

export { default as PixelText } from './PixelText';
export type { PixelTextProps } from './PixelText';

// 匯出字體相關工具函數和類型
export {
  PIXEL_FONT,
  CHAR_WIDTH,
  CHAR_HEIGHT,
  isCharacterSupported,
  getCharacterPixelData,
  calculateTextWidth,
} from './pixelFont';

export type { PixelCharacter } from './pixelFont';
