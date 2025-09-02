// =============================================================================
// PIXEL TEXT 2D 元件 - 使用 2D Canvas 渲染 8-bit 風格文字（不使用 WebGL）
// 與原 PixelText 保持相同 API，解決 WebGL context 限制問題
// =============================================================================

import { useEffect, useRef, useMemo, forwardRef, useState, useCallback } from 'react';
import { 
  getCharacterPixelData, 
  isCharacterSupported, 
  CHAR_WIDTH, 
  CHAR_HEIGHT
} from './pixelFont';
import { resolveCssColor, HDS_TOKENS } from '../../utils/colorTokens';
import type { PixelTextProps } from './PixelText';

const PixelText2D = forwardRef<HTMLDivElement, PixelTextProps>(({
  text = '',
  textEnabled = true,
  pixelSize = 4,
  pixelGap = 0,
  primaryColor = HDS_TOKENS.themeSurface,
  onPrimaryColor = HDS_TOKENS.onThemeSurface,
  letterSpacing = 1,
  width = 400,
  height = 100,
  antialias: _antialias, // 2D Canvas 版本不使用此參數，但保留以維持 API 相容性
  className = '',
  animated = false,
  durationTime = 1000,
  animationDelay = 100,
  glitchInterval = 20,
  easeGlitch = false,
  textBoxEnabled = false,
  textBox = '',
  textBoxWidth = 5,
  textBoxPadding = 2,
  marqueeEnabled = true,
  marqueeSpeed = 25,
  marqueePause = 300,
  spaceWidth = 2,
  swapTextAndBox = false,
  totalAnimationDuration,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationTimersRef = useRef<NodeJS.Timeout[]>([]);
  const glitchTimersRef = useRef<NodeJS.Timeout[]>([]);
  const marqueeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const marqueeRafRef = useRef<number | null>(null);
  const marqueeLastFrameTimeRef = useRef<number | null>(null);
  const marqueeOffsetFloatRef = useRef<number>(0);

  // 動畫狀態管理
  const [displayText, setDisplayText] = useState(text);
  const [displayTextBox, setDisplayTextBox] = useState(textBox);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // 動畫完成狀態追蹤
  const [textAnimationComplete, setTextAnimationComplete] = useState(false);
  const [textBoxAnimationComplete, setTextBoxAnimationComplete] = useState(false);

  // 跑馬燈狀態管理
  const [marqueeOffset, setMarqueeOffset] = useState(0);
  const [isMarqueeActive, setIsMarqueeActive] = useState(false);
  const isInViewportRef = useRef(true);

  // 監聽 theme 切換
  const [cssVarVersion, setCssVarVersion] = useState(0);
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (!root) return;
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'theme') {
          setCssVarVersion((v) => v + 1);
        }
      }
    });
    observer.observe(root, { attributes: true, attributeFilter: ['theme'] });
    if (body) observer.observe(body, { attributes: true, attributeFilter: ['theme'] });
    return () => observer.disconnect();
  }, []);

  // 同步 props 變化到 state（修正狀態殘留問題）
  useEffect(() => {
    if (!isAnimating) {
      // 只在非動畫狀態下立即同步，避免干擾動畫進行中的狀態
      setDisplayText(textEnabled ? text : '');
      setDisplayTextBox(textBoxEnabled ? textBox : '');
    }
  }, [text, textBox, textEnabled, textBoxEnabled, isAnimating]);

  // 計算字符實際寬度的輔助函數
  const getCharWidth = useCallback((char: string): number => {
    const pixelWithGap = pixelSize + pixelGap;
    
    if (char === ' ') {
      return letterSpacing * spaceWidth * pixelSize;
    }
    return CHAR_WIDTH * pixelWithGap - pixelGap;
  }, [letterSpacing, spaceWidth, pixelSize, pixelGap]);

  // 計算場景尺寸
  const sceneData = useMemo(() => {
    const currentText = displayText || text;
    const currentTextBox = displayTextBox || textBox;
    
    let totalWidth = 0;
    let totalHeight = CHAR_HEIGHT * (pixelSize + pixelGap) - pixelGap;
    let charCount = 0;

    const pixelWithGap = pixelSize + pixelGap;

    // 計算主文字寬度
    if (textEnabled && currentText) {
      charCount = currentText.length;
      let textTotalWidth = 0;
      
      Array.from(currentText).forEach((char, index) => {
        const charWidth = getCharWidth(char);
        textTotalWidth += charWidth;
        
        if (index < currentText.length - 1) {
          textTotalWidth += letterSpacing * pixelSize;
        }
      });
      
      totalWidth = textTotalWidth;
    }

    // 計算 text-box 寬度
    if (textBoxEnabled && (currentTextBox || textBoxWidth > 0)) {
      const boxCharCount = textBoxWidth;
      const boxCharWidth = boxCharCount * CHAR_WIDTH * pixelWithGap - boxCharCount * pixelGap;
      const boxSpacing = Math.max(0, boxCharCount - 1) * letterSpacing;
      const boxContentWidth = boxCharWidth + boxSpacing * pixelSize;
      
      const leftPadding = textBoxPadding * pixelSize;
      const rightPadding = Math.max(0, textBoxPadding * pixelSize - pixelSize);
      const horizontalPadding = leftPadding + rightPadding;
      
      const boxTotalWidth = boxContentWidth + horizontalPadding;
      
      if (textEnabled && currentText) {
        const baseSpacing = textBoxPadding * pixelSize;
        const extraSpacing = swapTextAndBox ? 2 * pixelSize : 0;
        totalWidth += baseSpacing + extraSpacing;
      }
      
      totalWidth += boxTotalWidth;
      charCount += boxCharCount;
    }

    return { totalWidth, totalHeight, charCount };
  }, [displayText, text, textEnabled, displayTextBox, textBox, textBoxEnabled, textBoxWidth, textBoxPadding, pixelSize, pixelGap, letterSpacing, getCharWidth, swapTextAndBox]);

  // 計算跑馬燈是否需要啟用
  const marqueeData = useMemo(() => {
    const currentTextBox = displayTextBox || textBox;
    const needsMarquee = marqueeEnabled && 
                        textBoxEnabled && 
                        currentTextBox && 
                        currentTextBox.length > textBoxWidth;
    
    if (!needsMarquee) {
      return { needsMarquee: false, maxOffset: 0, textLength: 0, totalTextPixels: 0, displayAreaPixels: 0, cycleLength: 0 };
    }
    
    let totalTextPixels = 0;
    const spacingPx = Math.round(letterSpacing * pixelSize);
    
    Array.from(currentTextBox).forEach((char, index) => {
      const charWidthPx = Math.round(getCharWidth(char));
      totalTextPixels += charWidthPx;
      
      if (index < currentTextBox.length - 1) {
        totalTextPixels += spacingPx;
      }
    });
    
    const pixelWithGap = pixelSize + pixelGap;
    const displayCharCount = textBoxWidth;
    const displayTextWidth = Math.round(displayCharCount * CHAR_WIDTH * pixelWithGap - displayCharCount * pixelGap);
    const displaySpacing = Math.round((displayCharCount - 1) * letterSpacing * pixelSize);
    const displayAreaPixels = displayTextWidth + displaySpacing;
    
    const maxOffset = Math.max(0, totalTextPixels - displayAreaPixels);
    const seamSpacingPixels = spacingPx;
    const cycleLength = Math.max(1, totalTextPixels + seamSpacingPixels);
    
    return { 
      needsMarquee, 
      maxOffset, 
      textLength: currentTextBox?.length || 0,
      totalTextPixels,
      displayAreaPixels,
      cycleLength
    };
  }, [displayTextBox, textBox, marqueeEnabled, textBoxEnabled, textBoxWidth, pixelSize, pixelGap, letterSpacing, getCharWidth]);

  // 支援的字符列表
  const supportedChars = useMemo(() => {
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,。.-+×÷?!@‼︎⁇▶︎◆●◼︎◻︎▷﹅⟨⟩[]⎢%″„'.split('');
  }, []);

  // 生成隨機字符
  const getRandomChar = useCallback(() => {
    return supportedChars[Math.floor(Math.random() * supportedChars.length)];
  }, [supportedChars]);

  // 生成隨機文字
  const generateRandomText = useCallback((length: number): string => {
    return Array.from({ length }, () => getRandomChar()).join('');
  }, [getRandomChar]);

  // 清除所有動畫計時器
  const clearAnimationTimers = useCallback(() => {
    animationTimersRef.current.forEach(timer => clearTimeout(timer));
    animationTimersRef.current = [];
    glitchTimersRef.current.forEach(timer => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    glitchTimersRef.current = [];
    
    if (marqueeTimerRef.current) {
      clearTimeout(marqueeTimerRef.current);
      marqueeTimerRef.current = null;
    }
  }, []);

  // 漸慢跳動效果的遞歸函數
  const createEaseGlitch = useCallback((
    charIndex: number, 
    targetChar: string, 
    startTime: number, 
    endTime: number
  ) => {
    const now = Date.now();
    const elapsed = now - startTime;
    
    if (elapsed < endTime) {
      setDisplayText(prev => {
        const chars = prev.split('');
        chars[charIndex] = getRandomChar();
        return chars.join('');
      });
      
      const progress = elapsed / endTime;
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const nextInterval = glitchInterval + (glitchInterval * 3 * easeProgress);
      
      const nextTimer = setTimeout(() => {
        createEaseGlitch(charIndex, targetChar, startTime, endTime);
      }, nextInterval);
      
      glitchTimersRef.current.push(nextTimer);
    } else {
      setDisplayText(prev => {
        const chars = prev.split('');
        chars[charIndex] = targetChar;
        return chars.join('');
      });
      
      if (charIndex === text.length - 1) {
        setTimeout(() => {
          setTextAnimationComplete(true);
        }, 50);
      }
    }
  }, [getRandomChar, glitchInterval, text.length]);

  // 漸慢跳動效果的遞歸函數（專用於 textBox）
  const createEaseGlitchForTextBox = useCallback((
    charIndex: number, 
    targetChar: string, 
    startTime: number, 
    endTime: number
  ) => {
    const now = Date.now();
    const elapsed = now - startTime;
    
    if (elapsed < endTime) {
      setDisplayTextBox(prev => {
        const chars = prev.split('');
        chars[charIndex] = getRandomChar();
        return chars.join('');
      });
      
      const progress = elapsed / endTime;
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const nextInterval = glitchInterval + (glitchInterval * 3 * easeProgress);
      
      const nextTimer = setTimeout(() => {
        createEaseGlitchForTextBox(charIndex, targetChar, startTime, endTime);
      }, nextInterval);
      
      glitchTimersRef.current.push(nextTimer);
    } else {
      setDisplayTextBox(prev => {
        const chars = prev.split('');
        chars[charIndex] = targetChar;
        return chars.join('');
      });
      
      if (charIndex === (textBox?.length || 0) - 1) {
        setTimeout(() => {
          setTextBoxAnimationComplete(true);
        }, 50);
      }
    }
  }, [getRandomChar, glitchInterval, textBox, text]);

  // 跑馬燈控制函數
  const startMarquee = useCallback(() => {
    if (!marqueeData.needsMarquee) return;

    setIsMarqueeActive(true);
    setMarqueeOffset(0);
    marqueeOffsetFloatRef.current = 0;
    marqueeLastFrameTimeRef.current = null;

    marqueeTimerRef.current = setTimeout(() => {
      const step = (now: number) => {
        if (!marqueeData.needsMarquee) return;

        const last = marqueeLastFrameTimeRef.current;
        marqueeLastFrameTimeRef.current = now;

        if (last != null) {
          const deltaMs = now - last;
          const pixelsPerMs = 1 / Math.max(1, marqueeSpeed);
          marqueeOffsetFloatRef.current += deltaMs * pixelsPerMs;

          if (marqueeOffsetFloatRef.current >= 1) {
            const inc = Math.floor(marqueeOffsetFloatRef.current);
            marqueeOffsetFloatRef.current -= inc;
            setMarqueeOffset(prev => prev + inc);
          }
        }

        marqueeRafRef.current = requestAnimationFrame(step);
      };

      marqueeRafRef.current = requestAnimationFrame(step);
    }, marqueePause);
  }, [marqueeData.needsMarquee, marqueeSpeed, marqueePause]);

  const stopMarquee = useCallback(() => {
    setIsMarqueeActive(false);
    setMarqueeOffset(0);
    if (marqueeTimerRef.current) {
      clearTimeout(marqueeTimerRef.current);
      marqueeTimerRef.current = null;
    }
    if (marqueeRafRef.current !== null) {
      cancelAnimationFrame(marqueeRafRef.current);
      marqueeRafRef.current = null;
    }
    marqueeLastFrameTimeRef.current = null;
    marqueeOffsetFloatRef.current = 0;
  }, []);

  // 檢查所有動畫是否完成
  useEffect(() => {
    const textShouldAnimate = textEnabled && text;
    const textBoxShouldAnimate = textBoxEnabled && textBox;
    
    const textCompleted = !textShouldAnimate || textAnimationComplete;
    const textBoxCompleted = !textBoxShouldAnimate || textBoxAnimationComplete;
    
    if (isAnimating && textCompleted && textBoxCompleted) {
      setTimeout(() => {
        setIsAnimating(false);
        if (marqueeData.needsMarquee) {
          startMarquee();
        }
      }, 100);
    }
  }, [isAnimating, textAnimationComplete, textBoxAnimationComplete, textEnabled, text, textBoxEnabled, textBox, marqueeData.needsMarquee, startMarquee]);

  // 開始文字動畫
  const startAnimation = useCallback(() => {
    if (!animated || (!(textEnabled && text) && !(textBoxEnabled && textBox))) return;

    setIsAnimating(true);
    
    setTextAnimationComplete(false);
    setTextBoxAnimationComplete(false);
    
    clearAnimationTimers();
    stopMarquee();

    // 立即清理並重設所有顯示狀態，避免狀態殘留
    if (textEnabled && text) {
      const initialRandomText = generateRandomText(text.length);
      setDisplayText(initialRandomText);
    } else {
      setDisplayText(''); // 清空主文字
    }
    
    if (textBoxEnabled && textBox) {
      const initialRandomTextBox = generateRandomText(textBox.length);
      setDisplayTextBox(initialRandomTextBox);
    } else {
      setDisplayTextBox(''); // 清空 text-box
    }

    const animationStartTime = Date.now();

    const textShouldAnimate = textEnabled && text;
    const textBoxShouldAnimate = textBoxEnabled && textBox;
    const textLen = textShouldAnimate ? text.length : 0;
    const textBoxLen = textBoxShouldAnimate ? (textBox ? textBox.length : 0) : 0;
    const maxLen = Math.max(textLen, textBoxLen);

    let effectiveDurationTime = durationTime;
    let effectiveAnimationDelay = animationDelay;
    if (animated && totalAnimationDuration && maxLen > 0) {
      const T = Math.max(1, totalAnimationDuration);
      if (maxLen === 1) {
        effectiveDurationTime = T;
        effectiveAnimationDelay = 0;
      } else {
        const baseFraction = 0.5;
        effectiveDurationTime = Math.max(0, Math.round(T * baseFraction));
        const steps = Math.max(1, maxLen - 1);
        effectiveAnimationDelay = Math.max(0, Math.round((T - effectiveDurationTime) / steps));
      }
    }

    // 為主文字的每個字符設置快速跳動和最終變換
    if (textEnabled && text) {
      text.split('').forEach((targetChar, index) => {
      const finalTime = effectiveDurationTime + (index * effectiveAnimationDelay);
      
      if (easeGlitch) {
        createEaseGlitch(index, targetChar, animationStartTime, finalTime);
      } else {
        const glitchTimer = setInterval(() => {
          setDisplayText(prev => {
            const chars = prev.split('');
            chars[index] = getRandomChar();
            return chars.join('');
          });
        }, glitchInterval);
        
        const finalTimer = setTimeout(() => {
          clearInterval(glitchTimer);
          
          setDisplayText(prev => {
            const chars = prev.split('');
            chars[index] = targetChar;
            return chars.join('');
          });
          
          if (index === text.length - 1) {
            setTimeout(() => {
              setTextAnimationComplete(true);
            }, 50);
          }
        }, finalTime);
        
        animationTimersRef.current.push(finalTimer);
        glitchTimersRef.current.push(glitchTimer);
      }
    });
    }

    // 為 textBox 的每個字符設置快速跳動和最終變換
    if (textBoxEnabled && textBox) {
      textBox.split('').forEach((targetChar, index) => {
        const finalTime = effectiveDurationTime + (index * effectiveAnimationDelay);
        
        if (easeGlitch) {
          createEaseGlitchForTextBox(index, targetChar, animationStartTime, finalTime);
        } else {
          const glitchTimer = setInterval(() => {
            setDisplayTextBox(prev => {
              const chars = prev.split('');
              chars[index] = getRandomChar();
              return chars.join('');
            });
          }, glitchInterval);
          
          const finalTimer = setTimeout(() => {
            clearInterval(glitchTimer);
            
            setDisplayTextBox(prev => {
              const chars = prev.split('');
              chars[index] = targetChar;
              return chars.join('');
            });
            
            if (index === textBox.length - 1) {
              setTimeout(() => {
                setTextBoxAnimationComplete(true);
              }, 50);
            }
          }, finalTime);
          
          animationTimersRef.current.push(finalTimer);
          glitchTimersRef.current.push(glitchTimer);
        }
      });
    }
  }, [animated, text, textEnabled, textBox, textBoxEnabled, durationTime, animationDelay, glitchInterval, easeGlitch, generateRandomText, clearAnimationTimers, getRandomChar, createEaseGlitch, createEaseGlitchForTextBox, stopMarquee, totalAnimationDuration]);

  // 解析顏色
  const resolvedPrimaryColor = useMemo(() => resolveCssColor(primaryColor, '#000000'), [primaryColor, cssVarVersion]);
  const resolvedOnPrimaryColor = useMemo(() => resolveCssColor(onPrimaryColor, '#FFFFFF'), [onPrimaryColor, cssVarVersion]);

  // 初始化 2D Canvas
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;
    
    // 設置 canvas 尺寸（不使用 DPR 縮放以避免模糊）
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // 設置渲染選項 - 關閉抗鋸齒以保持像素風格
    ctx.imageSmoothingEnabled = false;
    
    ctxRef.current = ctx;
    return ctx;
  }, [width, height]);

  // 繪製像素方塊
  const drawPixel = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, pixelSize, pixelSize);
  }, [pixelSize]);

  // 繪製文字
  const drawText = useCallback((ctx: CanvasRenderingContext2D) => {
    const currentText = displayText || text;
    const currentTextBox = displayTextBox || textBox;
    
    if (!(textEnabled && currentText) && !(textBoxEnabled && currentTextBox)) return;

    // 清除 canvas
    ctx.clearRect(0, 0, width, height);

    const pixelWithGap = pixelSize + pixelGap;
    const startX = Math.round((width - sceneData.totalWidth) / 2);
    const startY = Math.round((height - sceneData.totalHeight) / 2);

    let currentX = startX;

    const renderMainText = () => {
      if (!(textEnabled && currentText)) return;
      Array.from(currentText).forEach((char) => {
        if (char === ' ') {
          currentX += getCharWidth(char);
        } else {
          const pixelData = getCharacterPixelData(char);
          pixelData.forEach((row, rowIndex) => {
            row.forEach((pixel, colIndex) => {
              if (pixel === 1) {
                const x = Math.round(currentX + colIndex * pixelWithGap);
                const y = Math.round(startY + rowIndex * pixelWithGap);
                drawPixel(ctx, x, y, resolvedPrimaryColor);
              }
            });
          });
          currentX += getCharWidth(char);
        }
        currentX += letterSpacing * pixelSize;
      });
    };

    const renderTextBox = () => {
      if (!textBoxEnabled) return;
      if (!currentTextBox && textBoxWidth <= 0) return;
      
      const boxCharCount = textBoxWidth;
      const boxContentWidth = boxCharCount * CHAR_WIDTH * pixelWithGap - boxCharCount * pixelGap;
      const boxContentSpacing = Math.max(0, boxCharCount - 1) * letterSpacing * pixelSize;
      const totalContentWidth = boxContentWidth + boxContentSpacing;

      let actualContentWidth = 0;
      if (currentTextBox) {
        Array.from(currentTextBox).forEach((char, index) => {
          actualContentWidth += getCharWidth(char);
          if (index < currentTextBox.length - 1) {
            actualContentWidth += letterSpacing * pixelSize;
          }
        });
      }
      
      const displayContentWidth = (marqueeData.needsMarquee && (currentTextBox && currentTextBox.length > 0))
        ? totalContentWidth
        : Math.min(totalContentWidth, actualContentWidth || 0);
      
      const verticalPaddingPixels = textBoxPadding * pixelSize;
      const leftPaddingPixels = textBoxPadding * pixelSize;
      const rightPaddingPixels = Math.max(0, textBoxPadding * pixelSize - pixelSize);
      const backgroundWidth = displayContentWidth + leftPaddingPixels + rightPaddingPixels;
      
      const topPaddingPixels = verticalPaddingPixels;
      const bottomPaddingPixels = Math.max(0, verticalPaddingPixels - pixelSize);
      const textPixelHeight = CHAR_HEIGHT * pixelWithGap - pixelGap;
      const backgroundHeight = textPixelHeight + topPaddingPixels + bottomPaddingPixels;
      
      // 繪製背景
      const bgStartX = currentX;
      const bgStartY = startY - topPaddingPixels;
      
      ctx.fillStyle = resolvedPrimaryColor;
      ctx.fillRect(
        bgStartX,
        bgStartY,
        backgroundWidth,
        backgroundHeight
      );

      // 繪製文字內容
      if (currentTextBox) {
        const pixelWithGap = pixelSize + pixelGap;
        let characterPositions: Array<{char: string, startX: number, width: number}> = [];
        let accumulatedX = 0;
        
        Array.from(currentTextBox).forEach((char, index) => {
          const charWidth = Math.round(getCharWidth(char));
          characterPositions.push({
            char,
            startX: Math.round(accumulatedX),
            width: charWidth
          });
          
          accumulatedX += charWidth;
          
          if (index < currentTextBox.length - 1) {
            accumulatedX += Math.round(letterSpacing * pixelSize);
          }
        });
        
        let displayChars: Array<{char: string, offsetX: number}> = [];
        
        if (marqueeData.needsMarquee && (isMarqueeActive || marqueeOffset > 0)) {
          const currentPixelOffset = marqueeOffset;
          const cycleLength = Math.max(1, Math.round(marqueeData.cycleLength));
          const effectiveOffset = ((Math.round(currentPixelOffset) % cycleLength) + cycleLength) % cycleLength;
          
          characterPositions.forEach((charPos) => {
            const offsetX1 = charPos.startX - effectiveOffset;
            displayChars.push({
              char: charPos.char,
              offsetX: offsetX1,
            });
            
            const offsetX2 = offsetX1 + cycleLength;
            displayChars.push({
              char: charPos.char,
              offsetX: offsetX2,
            });
          });
        } else {
          const displayAreaWidth = displayContentWidth;
          let displayedWidth = 0;
          
          for (let i = 0; i < characterPositions.length; i++) {
            const charPos = characterPositions[i];
            
            if (displayedWidth + charPos.width > displayAreaWidth) {
              break;
            }
            
            displayChars.push({
              char: charPos.char,
              offsetX: charPos.startX
            });
            
            displayedWidth += charPos.width;
            if (i < characterPositions.length - 1) {
              displayedWidth += letterSpacing * pixelSize;
            }
          }
        }
        
        const baseTextStartY = startY;
        
        // 繪製每個字符
        displayChars.forEach((charInfo) => {
          if (charInfo.char === ' ') {
            return;
          }
          
          const pixelData = getCharacterPixelData(charInfo.char);
          const charBaseX = Math.round(currentX + leftPaddingPixels + charInfo.offsetX);
          
          pixelData.forEach((row, rowIndex) => {
            row.forEach((pixel, colIndex) => {
              if (pixel === 1) {
                const pixelX = colIndex * pixelWithGap;
                const pixelY = rowIndex * pixelWithGap;
                
                const finalX = Math.round(charBaseX + pixelX);
                const finalY = Math.round(baseTextStartY + pixelY);
                
                let shouldRender = true;
                const displayStartX = Math.round(currentX + leftPaddingPixels);
                const displayEndX = Math.round(displayStartX + displayContentWidth);
                
                if (marqueeData.needsMarquee && (isMarqueeActive || marqueeOffset > 0)) {
                  const pixelStartX = finalX;
                  const pixelEndX = finalX + pixelSize;
                  
                  if (pixelEndX <= displayStartX || pixelStartX >= displayEndX) {
                    shouldRender = false;
                  }
                }
                
                if (shouldRender) {
                  drawPixel(ctx, finalX, finalY, resolvedOnPrimaryColor);
                }
              }
            });
          });
        });
      }
      
      currentX += backgroundWidth;
    };

    if (swapTextAndBox) {
      renderTextBox();
      if (textEnabled && currentText && textBoxEnabled && (currentTextBox || textBoxWidth > 0)) {
        const baseSpacing = textBoxPadding * pixelSize;
        const extraSpacing = 2 * pixelSize;
        currentX += baseSpacing + extraSpacing;
      }
      renderMainText();
    } else {
      renderMainText();
      if (textEnabled && currentText && textBoxEnabled && (currentTextBox || textBoxWidth > 0)) {
        currentX += textBoxPadding * pixelSize;
      }
      renderTextBox();
    }
  }, [
    displayText, text, textEnabled, displayTextBox, textBox, textBoxEnabled, textBoxWidth, textBoxPadding,
    pixelSize, pixelGap, letterSpacing, width, height, sceneData, marqueeData, isMarqueeActive, marqueeOffset,
    getCharWidth, swapTextAndBox, resolvedPrimaryColor, resolvedOnPrimaryColor, drawPixel
  ]);

  // 渲染
  const render = useCallback(() => {
    const ctx = ctxRef.current || initializeCanvas();
    if (!ctx) return;
    drawText(ctx);
  }, [initializeCanvas, drawText]);

  // 當文字改變時處理動畫或直接更新
  useEffect(() => {
    if (animated) {
      startAnimation();
    } else {
      // 立即更新顯示狀態，確保正確清理
      setDisplayText(textEnabled ? text : '');
      setDisplayTextBox(textBoxEnabled ? textBox : '');
    }
  }, [text, textEnabled, textBox, textBoxEnabled, animated, startAnimation, swapTextAndBox]);

  // 當顯示文字或樣式改變時重新渲染
  useEffect(() => {
    render();
  }, [render]);

  // 當 width 或 height 改變時重新初始化 canvas
  useEffect(() => {
    // 強制重新初始化 canvas 以應用新的尺寸
    if (canvasRef.current) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      canvasRef.current.style.width = `${width}px`;
      canvasRef.current.style.height = `${height}px`;
    }
    ctxRef.current = null; // 強制重新獲取 context
    render();
  }, [width, height, render]);

  // 跑馬燈管理
  useEffect(() => {
    if (!isAnimating && marqueeData.needsMarquee && !isMarqueeActive) {
      startMarquee();
    } else if (!marqueeData.needsMarquee && isMarqueeActive) {
      stopMarquee();
    }
  }, [isAnimating, marqueeData.needsMarquee, isMarqueeActive, startMarquee, stopMarquee]);

  // 頁面可見性變化
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopMarquee();
        clearAnimationTimers();
      } else {
        if (!isAnimating && marqueeData.needsMarquee && isInViewportRef.current) {
          startMarquee();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearAnimationTimers, stopMarquee, startMarquee, marqueeData.needsMarquee, isAnimating]);

  // Intersection Observer
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      const isVisible = entry.isIntersecting && entry.intersectionRatio > 0;
      isInViewportRef.current = isVisible;
      if (!isVisible) {
        stopMarquee();
        clearAnimationTimers();
      } else if (!document.hidden) {
        if (!isAnimating && marqueeData.needsMarquee) {
          startMarquee();
        }
      }
    }, { root: null, threshold: [0, 0.01, 0.1, 0.5, 1] });

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [containerRef, stopMarquee, clearAnimationTimers, startMarquee, marqueeData.needsMarquee, isAnimating]);

  // 清理資源
  useEffect(() => {
    return () => {
      clearAnimationTimers();
      stopMarquee();
    };
  }, [clearAnimationTimers, stopMarquee]);

  // 警告不支援的字符
  useEffect(() => {
    if (textEnabled && text) {
      const unsupportedChars = Array.from(text).filter(char => !isCharacterSupported(char));
      if (unsupportedChars.length > 0) {
        console.warn(`PixelText2D: 以下字符不支援: ${unsupportedChars.join(', ')}`);
      }
    }
    
    if (textBoxEnabled && textBox) {
      const unsupportedChars = Array.from(textBox).filter(char => !isCharacterSupported(char));
      if (unsupportedChars.length > 0) {
        console.warn(`PixelText2D textBox: 以下字符不支援: ${unsupportedChars.join(', ')}`);
      }
    }
  }, [text, textEnabled, textBox, textBoxEnabled]);

  return (
    <div 
      ref={ref || containerRef}
      className={`pixel-text pixel-text-2d ${animated ? 'animated' : ''} ${isAnimating ? 'animating' : ''} ${className}`}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        display: 'inline-block'
      }}
    >
      <canvas 
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%',
          display: 'block'
        }} 
      />
    </div>
  );
});

PixelText2D.displayName = 'PixelText2D';

export default PixelText2D;
