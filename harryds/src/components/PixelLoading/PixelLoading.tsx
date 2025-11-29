// =============================================================================
// PIXEL LOADING 元件 - 8-bit 風格二進位像素顯示
// =============================================================================

import { useMemo, forwardRef } from 'react';
import { resolveCssColor, HDS_TOKENS } from '../../utils/colorTokens';
import { getCharacterPixelData, CHAR_WIDTH, CHAR_HEIGHT } from '../PixelText/pixelFont';
import './PixelLoading.scss';

export interface PixelLoadingProps {
  /** 進度值 (0-100) */
  progress?: number;
  /** 每個像素的大小 (px) */
  pixelSize?: number;
  /** 像素之間的間隔 (px) */
  pixelGap?: number;
  /** 像素顏色 */
  color?: string;
  /** 二進位數字的位數 (預設 7 位可顯示 0-100) */
  binaryDigits?: number;
  /** 是否啟用動畫效果 */
  animated?: boolean;
  /** 動畫速度 (ms) - 每個像素的動畫間隔 */
  animationSpeed?: number;
  /** 額外的 CSS 類名 */
  className?: string;
  /** 字符間距（像素數量） */
  letterSpacing?: number;
}

const PixelLoading = forwardRef<HTMLDivElement, PixelLoadingProps>(({
  progress = 0,
  pixelSize = 2,
  pixelGap = 0,
  color = HDS_TOKENS.themeSurface,
  binaryDigits = 7,
  animated = true,
  animationSpeed = 10,
  className = '',
  letterSpacing = 1,
}, ref) => {
  // 確保進度值在 0-100 範圍內
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  // 解析顏色
  const resolvedColor = useMemo(() => 
    resolveCssColor(color, '#000000'), [color]);
  
  // 將進度轉換為二進位字串
  const binaryString = useMemo(() => {
    const binary = Math.round(clampedProgress).toString(2);
    return binary.padStart(binaryDigits, '0');
  }, [clampedProgress, binaryDigits]);
  
  // 計算單位像素大小（含間隔）
  const pixelWithGap = pixelSize + pixelGap;
  
  // 計算總寬度
  const totalWidth = useMemo(() => {
    const charWidth = CHAR_WIDTH * pixelWithGap;
    const spacing = letterSpacing * pixelSize;
    return binaryDigits * charWidth + (binaryDigits - 1) * spacing;
  }, [binaryDigits, pixelWithGap, letterSpacing, pixelSize]);
  
  // 計算總高度
  const totalHeight = CHAR_HEIGHT * pixelWithGap;
  
  // 生成二進位數字的像素字型
  const binaryPixels = useMemo(() => {
    const pixels: JSX.Element[] = [];
    let currentX = 0;
    
    binaryString.split('').forEach((digit, charIndex) => {
      const pixelData = getCharacterPixelData(digit);
      const isOne = digit === '1';
      
      pixelData.forEach((row, rowIndex) => {
        row.forEach((pixel, colIndex) => {
          if (pixel === 1) {
            pixels.push(
              <div
                key={`pixel-${charIndex}-${rowIndex}-${colIndex}`}
                className={`pixel-loading__pixel ${isOne ? 'on' : 'off'}`}
                style={{
                  position: 'absolute',
                  left: currentX + colIndex * pixelWithGap,
                  top: rowIndex * pixelWithGap,
                  width: pixelSize,
                  height: pixelSize,
                  backgroundColor: resolvedColor,
                  opacity: isOne ? 1 : 1,
                  animationDelay: animated ? `${charIndex * animationSpeed}ms` : '0ms',
                }}
              />
            );
          }
        });
      });
      
      // 移動到下一個字符位置
      currentX += CHAR_WIDTH * pixelWithGap + letterSpacing * pixelSize;
    });
    
    return pixels;
  }, [binaryString, pixelSize, pixelWithGap, letterSpacing, resolvedColor, animated, animationSpeed]);

  return (
    <div
      ref={ref}
      className={`pixel-loading ${animated ? 'animated' : ''} ${className}`}
      style={{
        '--pixel-size': `${pixelSize}px`,
        '--pixel-gap': `${pixelGap}px`,
        '--pixel-color': resolvedColor,
        position: 'relative',
        width: totalWidth,
        height: totalHeight,
      } as React.CSSProperties}
    >
      {binaryPixels}
    </div>
  );
});

PixelLoading.displayName = 'PixelLoading';

export default PixelLoading;
