// =============================================================================
// PIXEL ICON 元件
// - 使用 pixelFont 中的符號渲染 8-bit 風格圖示
// - 輕量級純 CSS 渲染（不使用 Three.js）
// =============================================================================

import React, { useMemo } from 'react';
import { getCharacterPixelData, CHAR_WIDTH, CHAR_HEIGHT } from '../PixelText/pixelFont';
import './PixelIcon.scss';

export interface PixelIconProps {
  /** 要顯示的符號字符 */
  symbol: string;
  /** 每個像素的大小（預設 2px） */
  pixelSize?: number;
  /** 像素之間的間隔（預設 0） */
  pixelGap?: number;
  /** 圖示顏色 */
  color?: string;
  /** 額外的 CSS 類名 */
  className?: string;
}

export const PixelIcon: React.FC<PixelIconProps> = ({
  symbol,
  pixelSize = 2,
  pixelGap = 0,
  color = 'currentColor',
  className = '',
}) => {
  const pixelData = useMemo(() => getCharacterPixelData(symbol), [symbol]);
  
  const totalWidth = CHAR_WIDTH * pixelSize + (CHAR_WIDTH - 1) * pixelGap;
  const totalHeight = CHAR_HEIGHT * pixelSize + (CHAR_HEIGHT - 1) * pixelGap;

  const pixels = useMemo(() => {
    const result: { x: number; y: number }[] = [];
    pixelData.forEach((row, rowIndex) => {
      row.forEach((pixel, colIndex) => {
        if (pixel === 1) {
          result.push({
            x: colIndex * (pixelSize + pixelGap),
            y: rowIndex * (pixelSize + pixelGap),
          });
        }
      });
    });
    return result;
  }, [pixelData, pixelSize, pixelGap]);

  return (
    <span
      className={`hds-pixel-icon ${className}`.trim()}
      style={{
        width: `${totalWidth}px`,
        height: `${totalHeight}px`,
        '--pixel-color': color,
        '--pixel-size': `${pixelSize}px`,
      } as React.CSSProperties}
    >
      {pixels.map((pixel, index) => (
        <span
          key={index}
          className="hds-pixel-icon__pixel"
          style={{
            left: `${pixel.x}px`,
            top: `${pixel.y}px`,
          }}
        />
      ))}
    </span>
  );
};

export default PixelIcon;

