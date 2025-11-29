// =============================================================================
// PIXEL LOADING 元件 - 8-bit 風格二進位像素顯示
// =============================================================================

import { useMemo, forwardRef, useState, useEffect, useCallback } from 'react';
import { resolveCssColor, HDS_TOKENS } from '../../utils/colorTokens';
import { getCharacterPixelData, CHAR_WIDTH, CHAR_HEIGHT } from '../PixelText/pixelFont';
import './PixelLoading.scss';

// 隨機字符集
const GLITCH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';

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
  /** 是否顯示 Loading... 文字 */
  showLabel?: boolean;
  /** Loading 文字內容（不含 ...） */
  label?: string;
  /** 點點數量 */
  dotCount?: number;
  /** 亂數效果間隔 (ms) */
  glitchInterval?: number;
  /** 亂數跳動次數 */
  glitchCount?: number;
  /** 亂數跳動速度 (ms) */
  glitchSpeed?: number;
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
  showLabel = true,
  label = 'LOADING',
  dotCount = 3,
  glitchInterval = 1500,
  glitchCount = 5,
  glitchSpeed = 100,
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
  
  // 完整的 label 文字（含點點）
  const fullLabel = useMemo(() => {
    return label + '.'.repeat(dotCount);
  }, [label, dotCount]);
  
  // 顯示用的 label 文字（可能是亂數）
  const [displayLabel, setDisplayLabel] = useState(fullLabel);
  
  // 生成隨機字串
  const generateRandomLabel = useCallback(() => {
    return fullLabel.split('').map(char => {
      if (char === '.') return '.';
      return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
    }).join('');
  }, [fullLabel]);
  
  // 亂數效果
  useEffect(() => {
    if (!animated || !showLabel) {
      setDisplayLabel(fullLabel);
      return;
    }
    
    let mainIntervalId: NodeJS.Timeout;
    let glitchTimeoutIds: NodeJS.Timeout[] = [];
    
    const startGlitch = () => {
      // 清除之前的 timeout
      glitchTimeoutIds.forEach(id => clearTimeout(id));
      glitchTimeoutIds = [];
      
      // 執行亂數跳動
      for (let i = 0; i < glitchCount; i++) {
        const timeoutId = setTimeout(() => {
          setDisplayLabel(generateRandomLabel());
        }, i * glitchSpeed);
        glitchTimeoutIds.push(timeoutId);
      }
      
      // 最後恢復正確值
      const finalTimeoutId = setTimeout(() => {
        setDisplayLabel(fullLabel);
      }, glitchCount * glitchSpeed);
      glitchTimeoutIds.push(finalTimeoutId);
    };
    
    // 立即執行一次
    startGlitch();
    
    // 設置定期執行
    mainIntervalId = setInterval(startGlitch, glitchInterval);
    
    return () => {
      clearInterval(mainIntervalId);
      glitchTimeoutIds.forEach(id => clearTimeout(id));
    };
  }, [animated, showLabel, glitchInterval, glitchCount, glitchSpeed, fullLabel, generateRandomLabel]);
  
  // 當 label 改變時更新顯示
  useEffect(() => {
    setDisplayLabel(fullLabel);
  }, [fullLabel]);
  
  // 計算單位像素大小（含間隔）
  const pixelWithGap = pixelSize + pixelGap;
  
  // 計算二進位數字的寬度
  const binaryWidth = useMemo(() => {
    const charWidth = CHAR_WIDTH * pixelWithGap;
    const spacing = letterSpacing * pixelSize;
    return binaryDigits * charWidth + (binaryDigits - 1) * spacing;
  }, [binaryDigits, pixelWithGap, letterSpacing, pixelSize]);
  
  // 計算單行高度
  const lineHeight = CHAR_HEIGHT * pixelWithGap;
  
  // 計算 label 字體大小（基於 pixelSize）
  const labelFontSize = pixelSize * 6;
  
  // 計算行間距
  const lineSpacing = pixelSize * 2;
  
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
                key={`binary-${charIndex}-${rowIndex}-${colIndex}`}
                className={`pixel-loading__pixel ${isOne ? 'on' : 'off'}`}
                style={{
                  position: 'absolute',
                  left: currentX + colIndex * pixelWithGap,
                  top: rowIndex * pixelWithGap,
                  width: pixelSize,
                  height: pixelSize,
                  backgroundColor: resolvedColor,
                  opacity: 1,
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

  // 渲染 label 文字（分離點點以保持動畫）
  const renderLabel = useMemo(() => {
    const labelPart = displayLabel.slice(0, label.length);
    const dotsPart = displayLabel.slice(label.length);
    
    return (
      <>
        {labelPart}
        {dotsPart.split('').map((dot, index) => (
          <span
            key={`dot-${index}`}
            className="pixel-loading__dot"
            style={{
              animationDelay: `${index * 300}ms`,
            }}
          >
            {dot}
          </span>
        ))}
      </>
    );
  }, [displayLabel, label.length]);

  return (
    <div
      ref={ref}
      className={`pixel-loading ${animated ? 'animated' : ''} ${className}`}
      style={{
        '--pixel-size': `${pixelSize}px`,
        '--pixel-gap': `${pixelGap}px`,
        '--pixel-color': resolvedColor,
      } as React.CSSProperties}
    >
      {/* 二進位數字 */}
      <div
        className="pixel-loading__binary"
        style={{
          position: 'relative',
          width: binaryWidth,
          height: lineHeight,
        }}
      >
        {binaryPixels}
      </div>
      
      {/* Loading 文字 */}
      {showLabel && (
        <div
          className="pixel-loading__label"
          style={{
            marginTop: lineSpacing,
            fontFamily: "'Pixel', monospace",
            fontSize: labelFontSize,
            color: resolvedColor,
            textAlign: 'center',
            lineHeight: 1,
          }}
        >
          {renderLabel}
        </div>
      )}
    </div>
  );
});

PixelLoading.displayName = 'PixelLoading';

export default PixelLoading;
