/**
 * 根據文字內容計算 PixelText 所需的寬度
 * 基於 PixelText 內部的計算邏輯
 */

const CHAR_WIDTH = 8; // 從 harryds/src/components/PixelText/pixelFont.ts 導出的常數
const CHAR_HEIGHT = 8;

export interface CalculateWidthOptions {
  pixelSize?: number;
  pixelGap?: number;
  letterSpacing?: number;
  spaceWidth?: number;
}

export const calculatePixelTextWidth = (
  text: string, 
  options: CalculateWidthOptions = {}
): number => {
  const {
    pixelSize = 4,
    pixelGap = 0,
    letterSpacing = 1,
    spaceWidth = 2
  } = options;

  if (!text) return 0;

  const pixelWithGap = pixelSize + pixelGap;
  let totalWidth = 0;

  // 逐字符計算寬度
  Array.from(text).forEach((char, index) => {
    let charWidth: number;
    
    // 處理空格
    if (char === ' ') {
      charWidth = spaceWidth * pixelWithGap - pixelGap;
    } else {
      charWidth = CHAR_WIDTH * pixelWithGap - pixelGap;
    }
    
    totalWidth += charWidth;
    
    // 添加字符間距（最後一個字符不添加）
    if (index < text.length - 1) {
      totalWidth += letterSpacing * pixelSize;
    }
  });

  return Math.ceil(totalWidth);
};

export const calculatePixelTextHeight = (
  pixelSize: number = 4,
  pixelGap: number = 0
): number => {
  return CHAR_HEIGHT * (pixelSize + pixelGap) - pixelGap;
};
