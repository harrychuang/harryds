// =============================================================================
// PIXEL TEXT 元件 - 使用 Three.js 渲染 8-bit 風格文字
// =============================================================================

import { useEffect, useRef, useMemo, forwardRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  getCharacterPixelData, 
  isCharacterSupported, 
  CHAR_WIDTH, 
  CHAR_HEIGHT
} from './pixelFont';

export interface PixelTextProps {
  /** 要顯示的文字 */
  text: string;
  /** 是否啟用主文字顯示 */
  textEnabled?: boolean;
  /** 每個像素的大小 */
  pixelSize?: number;
  /** 像素之間的間隔 */
  pixelGap?: number;
  /** 主色調（text 文字顏色 & text-box 背景色） */
  primaryColor?: string;
  /** 主色調上的文字顏色（text-box 文字顏色） */
  onPrimaryColor?: string;
  /** 文字之間的字間距 */
  letterSpacing?: number;
  /** Canvas 寬度 */
  width?: number;
  /** Canvas 高度 */
  height?: number;
  /** 是否啟用抗鋸齒 */
  antialias?: boolean;
  /** 元件的 CSS 類名 */
  className?: string;
  /** 是否啟用動畫效果 */
  animated?: boolean;

  /** 每個字母跳動的持續時間（毫秒） */
  durationTime?: number;
  /** 字符間的動畫延遲時間（毫秒） */
  animationDelay?: number;
  /** 亂碼跳動間隔時間（毫秒） */
  glitchInterval?: number;
  /** 是否啟用漸慢的亂碼動畫效果 */
  easeGlitch?: boolean;

  /** 是否啟用 text-box */
  textBoxEnabled?: boolean;
  /** text-box 要顯示的文字 */
  textBox?: string;
  /** text-box 的寬度（用字母數量表示） */
  textBoxWidth?: number;
  /** text-box 的內邊距（pixelSize 的倍數） */
  textBoxPadding?: number;

  /** 是否啟用跑馬燈效果（當 text-box 文字過長時） */
  marqueeEnabled?: boolean;
  /** 跑馬燈移動速度（毫秒）- 每個像素移動的間隔時間 */
  marqueeSpeed?: number;
  /** 跑馬燈在開始和結束時的暫停時間（毫秒） */
  marqueePause?: number;

  /** 空格字符的寬度倍數（相對於 letterSpacing 的倍數，預設為 2） */
  spaceWidth?: number;
}

const PixelText = forwardRef<HTMLDivElement, PixelTextProps>(({
  text = '',
  textEnabled = true,
  pixelSize = 4,
  pixelGap = 0,
  primaryColor = '#000000',
  onPrimaryColor = '#FFFFFF',
  letterSpacing = 1,
  width = 400,
  height = 100,
  antialias = false,
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
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const animationTimersRef = useRef<NodeJS.Timeout[]>([]);
  const glitchTimersRef = useRef<NodeJS.Timeout[]>([]);
  const marqueeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const marqueeRafRef = useRef<number | null>(null);
  const marqueeLastFrameTimeRef = useRef<number | null>(null);
  const marqueeOffsetFloatRef = useRef<number>(0);

  // 保留未來優化批次渲染的空間（目前不啟用群組以避免未使用警告）

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

  // 計算字符實際寬度的輔助函數
  const getCharWidth = useCallback((char: string): number => {
    const pixelWithGap = pixelSize + pixelGap;
    
    if (char === ' ') {
      // 空格使用自定義寬度：letterSpacing * spaceWidth
      return letterSpacing * spaceWidth * pixelSize;
    }
    // 其他字符使用標準寬度
    return CHAR_WIDTH * pixelWithGap - pixelGap;
  }, [letterSpacing, spaceWidth, pixelSize, pixelGap]);

  // 計算場景尺寸 - 使用 displayText 而不是 text
  const sceneData = useMemo(() => {
    const currentText = displayText || text;
    const currentTextBox = displayTextBox || textBox;
    
    let totalWidth = 0;
    let totalHeight = CHAR_HEIGHT * (pixelSize + pixelGap) - pixelGap;
    let charCount = 0;

    const pixelWithGap = pixelSize + pixelGap;

    // 計算主文字寬度（如果啟用）
    if (textEnabled && currentText) {
      charCount = currentText.length;
      let textTotalWidth = 0;
      
      // 逐字符計算寬度（考慮空格特殊處理）
      Array.from(currentText).forEach((char, index) => {
        const charWidth = getCharWidth(char);
        textTotalWidth += charWidth;
        
        // 添加字符間距（最後一個字符不添加）
        if (index < currentText.length - 1) {
          textTotalWidth += letterSpacing * pixelSize;
        }
      });
      
      totalWidth = textTotalWidth;
    }

    // 計算 text-box 寬度（如果啟用且有內容的話）
    if (textBoxEnabled && (currentTextBox || textBoxWidth > 0)) {
      const boxCharCount = textBoxWidth;
      const boxCharWidth = boxCharCount * CHAR_WIDTH * pixelWithGap - boxCharCount * pixelGap;
      const boxSpacing = Math.max(0, boxCharCount - 1) * letterSpacing;
      const boxContentWidth = boxCharWidth + boxSpacing * pixelSize;
      
      // 根據是否需要跑馬燈決定 padding（右邊 padding 比左邊少一個像素）
      const needsMarquee = marqueeEnabled && 
                          textBoxEnabled && 
                          currentTextBox && 
                          currentTextBox.length > textBoxWidth;
      const leftPadding = needsMarquee ? 0 : textBoxPadding * pixelSize;
      const rightPadding = needsMarquee ? 0 : Math.max(0, textBoxPadding * pixelSize - pixelSize);
      const horizontalPadding = leftPadding + rightPadding;
      
      // 加入 padding
      const boxTotalWidth = boxContentWidth + horizontalPadding;
      
      // 如果同時有主文字和 text-box，需要加上間隔（使用 textBoxPadding 作為間距）
      if (textEnabled && currentText) {
        totalWidth += textBoxPadding * pixelSize; // 主文字和 text-box 之間的間隔
      }
      
      totalWidth += boxTotalWidth;
      charCount += boxCharCount;
    }

    return { totalWidth, totalHeight, charCount };
  }, [displayText, text, textEnabled, displayTextBox, textBox, textBoxEnabled, textBoxWidth, textBoxPadding, pixelSize, pixelGap, letterSpacing, marqueeEnabled, getCharWidth]);

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
    
    // 計算文字的總像素長度（包含間距，考慮空格特殊寬度）
    let totalTextPixels = 0;
    
    Array.from(currentTextBox).forEach((char, index) => {
      const charWidth = getCharWidth(char);
      totalTextPixels += charWidth;
      
      // 添加字符間距（最後一個字符不添加）
      if (index < currentTextBox.length - 1) {
        totalTextPixels += letterSpacing * pixelSize;
      }
    });
    
    // 計算顯示區域的像素長度
    const pixelWithGap = pixelSize + pixelGap;
    const displayCharCount = textBoxWidth;
    const displayTextWidth = displayCharCount * CHAR_WIDTH * pixelWithGap - displayCharCount * pixelGap;
    const displaySpacing = (displayCharCount - 1) * letterSpacing * pixelSize;
    const displayAreaPixels = displayTextWidth + displaySpacing;
    
    // 最大偏移量（以像素為單位）
    const maxOffset = Math.max(0, totalTextPixels - displayAreaPixels);
    
    // 循環長度：文字總長度 + 顯示區域長度（讓文字完全消失後再從頭開始出現）
    // NOTE: 為了實現無縫滾動，循環長度應為文字的總像素長度。
    // 原本的 `totalTextPixels + displayAreaPixels` 會在文字滾動完畢後產生一段空白，這與目前的渲染邏輯不符，導致跳動。
    const cycleLength = totalTextPixels;
    
    return { 
      needsMarquee, 
      maxOffset, 
      textLength: currentTextBox?.length || 0,
      totalTextPixels,
      displayAreaPixels,
      cycleLength
    };
  }, [displayTextBox, textBox, marqueeEnabled, textBoxEnabled, textBoxWidth, pixelSize, pixelGap, letterSpacing, getCharWidth]);

  // 支援的字符列表（用於生成隨機字符）
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
    // glitchTimersRef 可能包含 setInterval 或 setTimeout，都用 clearTimeout 清除（向後相容）
    glitchTimersRef.current.forEach(timer => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    glitchTimersRef.current = [];
    
    // 清除跑馬燈計時器
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
    
    // 如果還沒到停止時間，繼續跳動
    if (elapsed < endTime) {
      // 更新字符為隨機字符
      setDisplayText(prev => {
        const chars = prev.split('');
        chars[charIndex] = getRandomChar();
        return chars.join('');
      });
      
      // 計算下次跳動的間隔 - 漸慢效果
      const progress = elapsed / endTime; // 0 到 1 的進度
      const easeProgress = 1 - Math.pow(1 - progress, 3); // ease-out 曲線
      const nextInterval = glitchInterval + (glitchInterval * 3 * easeProgress); // 最終會變慢到4倍
      
      // 設置下次跳動
      const nextTimer = setTimeout(() => {
        createEaseGlitch(charIndex, targetChar, startTime, endTime);
      }, nextInterval);
      
      glitchTimersRef.current.push(nextTimer);
    } else {
      // 時間到了，設置最終字符
      setDisplayText(prev => {
        const chars = prev.split('');
        chars[charIndex] = targetChar;
        return chars.join('');
      });
      
      // 如果是最後一個字符，標記主文字動畫完成
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
    
    // 如果還沒到停止時間，繼續跳動
    if (elapsed < endTime) {
      // 更新字符為隨機字符
      setDisplayTextBox(prev => {
        const chars = prev.split('');
        chars[charIndex] = getRandomChar();
        return chars.join('');
      });
      
      // 計算下次跳動的間隔 - 漸慢效果
      const progress = elapsed / endTime; // 0 到 1 的進度
      const easeProgress = 1 - Math.pow(1 - progress, 3); // ease-out 曲線
      const nextInterval = glitchInterval + (glitchInterval * 3 * easeProgress); // 最終會變慢到4倍
      
      // 設置下次跳動
      const nextTimer = setTimeout(() => {
        createEaseGlitchForTextBox(charIndex, targetChar, startTime, endTime);
      }, nextInterval);
      
      glitchTimersRef.current.push(nextTimer);
    } else {
      // 時間到了，設置最終字符
      setDisplayTextBox(prev => {
        const chars = prev.split('');
        chars[charIndex] = targetChar;
        return chars.join('');
      });
      
      // 如果是最後一個字符，標記 textBox 動畫完成
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

    // 先用 timeout 實作起始暫停，之後進入 rAF 迴圈
    marqueeTimerRef.current = setTimeout(() => {
      const step = (now: number) => {
        if (!marqueeData.needsMarquee) return;

        const last = marqueeLastFrameTimeRef.current;
        marqueeLastFrameTimeRef.current = now;

        if (last != null) {
          const deltaMs = now - last;
          // 將「每像素毫秒」轉為每毫秒像素
          const pixelsPerMs = 1 / Math.max(1, marqueeSpeed);
          marqueeOffsetFloatRef.current += deltaMs * pixelsPerMs;

          // 只在累積到整數像素時才更新，保持像素對齊
          if (marqueeOffsetFloatRef.current >= 1) {
            const inc = Math.floor(marqueeOffsetFloatRef.current);
            marqueeOffsetFloatRef.current -= inc;
            setMarqueeOffset(prev => (prev + inc) % (marqueeData.cycleLength || 1));
          }
        }

        marqueeRafRef.current = requestAnimationFrame(step);
      };

      marqueeRafRef.current = requestAnimationFrame(step);
    }, marqueePause);
  }, [marqueeData.needsMarquee, marqueeData.cycleLength, marqueeSpeed, marqueePause]);

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
    
    // 當所有需要動畫的部分都完成時
    if (isAnimating && textCompleted && textBoxCompleted) {
      setTimeout(() => {
        setIsAnimating(false);
        // 動畫結束後立即啟動跑馬燈（如果需要的話）
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
    
    // 重置動畫完成狀態
    setTextAnimationComplete(false);
    setTextBoxAnimationComplete(false);
    
    // 清除之前的計時器（包括跑馬燈）
    clearAnimationTimers();
    stopMarquee();

    // 初始設置為隨機文字
    if (textEnabled && text) {
      const initialRandomText = generateRandomText(text.length);
      setDisplayText(initialRandomText);
    }
    
    if (textBoxEnabled && textBox) {
      const initialRandomTextBox = generateRandomText(textBox.length);
      setDisplayTextBox(initialRandomTextBox);
    }

    const animationStartTime = Date.now();

    // 為主文字的每個字符設置快速跳動和最終變換
    if (textEnabled && text) {
      text.split('').forEach((targetChar, index) => {
      const finalTime = durationTime + (index * animationDelay); // 何時停止跳動並顯示最終字符
      
      if (easeGlitch) {
        // 使用漸慢效果
        createEaseGlitch(index, targetChar, animationStartTime, finalTime);
      } else {
        // 使用傳統均勻跳動
        const glitchTimer = setInterval(() => {
          setDisplayText(prev => {
            const chars = prev.split('');
            chars[index] = getRandomChar();
            return chars.join('');
          });
        }, glitchInterval);
        
        // 設置最終變換計時器
        const finalTimer = setTimeout(() => {
          // 停止跳動
          clearInterval(glitchTimer);
          
          // 設置最終字符
          setDisplayText(prev => {
            const chars = prev.split('');
            chars[index] = targetChar;
            return chars.join('');
          });
          
          // 如果是最後一個字符，標記主文字動畫完成
          if (index === text.length - 1) {
            setTimeout(() => {
              setTextAnimationComplete(true);
            }, 50);
          }
        }, finalTime);
        
        // 保存計時器以便清理
        animationTimersRef.current.push(finalTimer);
        glitchTimersRef.current.push(glitchTimer);
      }
    });
    }

    // 為 textBox 的每個字符設置快速跳動和最終變換
    if (textBoxEnabled && textBox) {
      textBox.split('').forEach((targetChar, index) => {
        const finalTime = durationTime + (index * animationDelay);
        
        if (easeGlitch) {
          // 使用漸慢效果（需要創建 textBox 專用的 ease 函數）
          createEaseGlitchForTextBox(index, targetChar, animationStartTime, finalTime);
        } else {
          // 使用傳統均勻跳動
          const glitchTimer = setInterval(() => {
            setDisplayTextBox(prev => {
              const chars = prev.split('');
              chars[index] = getRandomChar();
              return chars.join('');
            });
          }, glitchInterval);
          
          // 設置最終變換計時器
          const finalTimer = setTimeout(() => {
            // 停止跳動
            clearInterval(glitchTimer);
            
            // 設置最終字符
            setDisplayTextBox(prev => {
              const chars = prev.split('');
              chars[index] = targetChar;
              return chars.join('');
            });
            
            // 如果是最後一個字符，標記 textBox 動畫完成
            if (index === textBox.length - 1) {
              setTimeout(() => {
                setTextBoxAnimationComplete(true);
              }, 50);
            }
          }, finalTime);
          
          // 保存計時器以便清理
          animationTimersRef.current.push(finalTimer);
          glitchTimersRef.current.push(glitchTimer);
        }
      });
    }
  }, [animated, text, textEnabled, textBox, textBoxEnabled, durationTime, animationDelay, glitchInterval, easeGlitch, generateRandomText, clearAnimationTimers, getRandomChar, createEaseGlitch, createEaseGlitchForTextBox, stopMarquee]);

  // 建立像素幾何體的材質和幾何體（重用以提升效能）
  const pixelGeometry = useMemo(() => new THREE.PlaneGeometry(pixelSize, pixelSize), [pixelSize]);
  
  // text 文字材質（使用 primaryColor）
  const pixelMaterial = useMemo(() => new THREE.MeshBasicMaterial({ 
    color: new THREE.Color(primaryColor) 
  }), [primaryColor]);

  // text-box 文字材質（使用 onPrimaryColor）
  const textBoxPixelMaterial = useMemo(() => new THREE.MeshBasicMaterial({ 
    color: new THREE.Color(onPrimaryColor) 
  }), [onPrimaryColor]);

  // text-box 背景材質（使用 primaryColor）
  const textBoxBackgroundMaterial = useMemo(() => new THREE.MeshBasicMaterial({ 
    color: new THREE.Color(primaryColor) 
  }), [primaryColor]);

  // 初始化 Three.js 場景
  const initializeThreeJS = () => {
    if (!canvasRef.current) return;

    // 若已初始化，直接回傳現有資源
    if (sceneRef.current && cameraRef.current && rendererRef.current) {
      return { scene: sceneRef.current, camera: cameraRef.current, renderer: rendererRef.current };
    }

    // 建立場景
    const scene = new THREE.Scene();
    scene.background = null; // 使用透明背景
    sceneRef.current = scene;

    // 建立相機 - 使用正交相機以獲得像素完美的效果
    const camera = new THREE.OrthographicCamera(
      -width / 2, width / 2,
      height / 2, -height / 2,
      0.1, 1000
    );
    camera.position.z = 1;
    cameraRef.current = camera;

    // 建立渲染器（重用同一個 WebGLRenderer）
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias,
      alpha: true, // 永遠使用透明背景
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    // 限制像素比例提高行動裝置效能
    const maxPixelRatio = 1.5;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
    rendererRef.current = renderer;

    return { scene, camera, renderer };
  };

  // 建立文字的像素網格
  const createPixelText = useCallback(() => {
    const { scene } = initializeThreeJS() || {};
    if (!scene) return;

    // 清除之前的網格（移除節點但不釋放共用幾何/材質，以避免重複釋放）
    while (scene.children.length > 0) {
      const child = scene.children[0];
      scene.remove(child);
    }

    const currentText = displayText || text;
    const currentTextBox = displayTextBox || textBox;
    
    if (!(textEnabled && currentText) && !(textBoxEnabled && currentTextBox)) return;

    // 計算起始位置以置中文字
    const pixelWithGap = pixelSize + pixelGap;
    const startX = Math.round(-sceneData.totalWidth / 2 + pixelSize / 2);
    const startY = Math.round(CHAR_HEIGHT * pixelWithGap / 2 - pixelSize / 2 - pixelGap / 2);

    let currentX = startX;

    // 渲染主文字（如果啟用且有內容的話）
    if (textEnabled && currentText) {
      Array.from(currentText).forEach((char) => {
        if (char === ' ') {
          // 空格不渲染像素，只移動位置
          currentX += getCharWidth(char);
        } else {
          const pixelData = getCharacterPixelData(char);
          
          // 為每個像素建立方塊
          pixelData.forEach((row, rowIndex) => {
            row.forEach((pixel, colIndex) => {
              if (pixel === 1) {
                // 建立像素實例
                const pixelMesh = new THREE.Mesh(pixelGeometry, pixelMaterial);
                
                // 計算位置 - 加入 pixelGap 間距並對齊整數像素
                const x = Math.round(currentX + colIndex * pixelWithGap);
                const y = Math.round(startY - rowIndex * pixelWithGap);
                
                pixelMesh.position.set(x, y, 0);
                scene.add(pixelMesh);
              }
            });
          });

          // 移動標準字符寬度
          currentX += getCharWidth(char);
        }

        // 添加字符間距（適用於所有字符，包括空格）
        currentX += letterSpacing * pixelSize;
      });
  }

  // 如果同時啟用 text 和 textBox，在兩者之間加上間隔（使用 textBoxPadding 作為間距）
  if (textEnabled && currentText && textBoxEnabled && (currentTextBox || textBoxWidth > 0)) {
    currentX += textBoxPadding * pixelSize; // text 和 text-box 容器之間的間隔
  }

  // 渲染 text-box（如果啟用且有內容的話）
  if (textBoxEnabled && (currentTextBox || textBoxWidth > 0)) {
      // 計算 text-box 的尺寸
      const boxCharCount = textBoxWidth;
      const boxContentWidth = boxCharCount * CHAR_WIDTH * pixelWithGap - boxCharCount * pixelGap;
      const boxContentSpacing = Math.max(0, boxCharCount - 1) * letterSpacing * pixelSize;
      const totalContentWidth = boxContentWidth + boxContentSpacing; // 容量寬度（以 textBoxWidth 計算）

      // 實際內容寬度（依 currentTextBox 逐字計算，考慮空格與 letterSpacing）
      let actualContentWidth = 0;
      if (currentTextBox) {
        Array.from(currentTextBox).forEach((char, index) => {
          actualContentWidth += getCharWidth(char);
          if (index < currentTextBox.length - 1) {
            actualContentWidth += letterSpacing * pixelSize;
          }
        });
      }
      // 決定顯示內容寬度：跑馬燈用容量寬度；否則用實際內容寬度（有 auto-layout 感）
      const displayContentWidth = (marqueeData.needsMarquee && (currentTextBox && currentTextBox.length > 0))
        ? totalContentWidth
        : Math.min(totalContentWidth, actualContentWidth || 0);
      
      // 計算包含 padding 的背景尺寸（跑馬燈模式下左右 padding 為 0）
      const verticalPaddingPixels = textBoxPadding * pixelSize;
      // 右邊 padding 比左邊少一個像素
      const leftPaddingPixels = marqueeData.needsMarquee ? 0 : textBoxPadding * pixelSize;
      const rightPaddingPixels = marqueeData.needsMarquee ? 0 : Math.max(0, textBoxPadding * pixelSize - pixelSize);
      const backgroundWidth = displayContentWidth + leftPaddingPixels + rightPaddingPixels;
      // 底部 padding 比頂部少一個像素
      const topPaddingPixels = verticalPaddingPixels;
      const bottomPaddingPixels = Math.max(0, verticalPaddingPixels - pixelSize);
      // 背景高度需包含 pixelGap 造成的行間距
      const textPixelHeight = CHAR_HEIGHT * pixelWithGap - pixelGap;
      const backgroundHeight = textPixelHeight + topPaddingPixels + bottomPaddingPixels;
      
      // 渲染 text-box 背景（包含 padding）
      const bgStartX = currentX; // 從當前位置開始（已包含間距）
      const bgStartY = startY + topPaddingPixels;
      
      for (let row = 0; row < Math.ceil(backgroundHeight / pixelWithGap); row++) {
        for (let col = 0; col < Math.ceil(backgroundWidth / pixelWithGap); col++) {
          const bgMesh = new THREE.Mesh(pixelGeometry, textBoxBackgroundMaterial);
          const x = Math.round(bgStartX + col * pixelWithGap);
          const y = Math.round(bgStartY - row * pixelWithGap);
          bgMesh.position.set(x, y, -0.1); // 背景放在後面
          scene.add(bgMesh);
        }
      }

      // 渲染 text-box 文字內容（置中，支援跑馬燈）
      if (currentTextBox) {
        // 計算每個字符的實際位置（考慮空格特殊寬度）
        const pixelWithGap = pixelSize + pixelGap;
        let characterPositions: Array<{char: string, startX: number, width: number}> = [];
        let accumulatedX = 0;
        
        // 預先計算所有字符的位置
        Array.from(currentTextBox).forEach((char, index) => {
          const charWidth = getCharWidth(char);
          characterPositions.push({
            char,
            startX: accumulatedX,
            width: charWidth
          });
          
          accumulatedX += charWidth;
          
          // 添加字符間距（最後一個字符不添加）
          if (index < currentTextBox.length - 1) {
            accumulatedX += letterSpacing * pixelSize;
          }
        });
        
        // 計算當前像素偏移對應的字符範圍
        let displayChars: Array<{char: string, offsetX: number, clipLeft?: number, clipRight?: number}> = [];
        
        if (marqueeData.needsMarquee && (isMarqueeActive || marqueeOffset > 0)) {
          // 跑馬燈模式：透過渲染兩份文字來實現無縫循環滾動
          const currentPixelOffset = marqueeOffset;
          
          // 確保循環長度與動畫計時器一致
          const cycleLength = marqueeData.cycleLength;
          const effectiveOffset = currentPixelOffset % cycleLength;
          
          // 遍歷所有字符，並為每個字符計算兩個實例的位置（一個跟著一個）
          characterPositions.forEach((charPos) => {
            // 第一個實例的位置
            const offsetX1 = charPos.startX - effectiveOffset;
            displayChars.push({
              char: charPos.char,
              offsetX: offsetX1,
            });
            
            // 第二個實例，緊跟在第一個後面，實現無縫連接
            const offsetX2 = offsetX1 + cycleLength;
            displayChars.push({
              char: charPos.char,
              offsetX: offsetX2,
            });
          });
        } else {
          // 正常模式：使用精確的字符位置，但只取前面的字符
          const displayAreaWidth = displayContentWidth;
          let displayedWidth = 0;
          
          for (let i = 0; i < characterPositions.length; i++) {
            const charPos = characterPositions[i];
            
            // 檢查是否還有空間顯示這個字符
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
        
        // 計算垂直置中的起始位置
        const textHeight = CHAR_HEIGHT * pixelWithGap - pixelGap;
        const availableHeight = CHAR_HEIGHT * pixelWithGap - pixelGap;
        const verticalOffset = (availableHeight - textHeight) / 2;
        const baseTextStartY = startY - verticalOffset;
        
        // 渲染每個字符
        displayChars.forEach((charInfo) => {
          if (charInfo.char === ' ') {
            // 空格不渲染任何像素
            return;
          }
          
          const pixelData = getCharacterPixelData(charInfo.char);
          
          // 計算字符的基礎位置（跑馬燈模式下無水平 padding）
          const charBaseX = currentX + leftPaddingPixels + charInfo.offsetX;
          
          // 為每個像素建立方塊（支援裁切）
          pixelData.forEach((row, rowIndex) => {
            row.forEach((pixel, colIndex) => {
              if (pixel === 1) {
                // 計算像素的實際位置
                const pixelX = colIndex * pixelWithGap;
                const pixelY = rowIndex * pixelWithGap;
                
                // 計算最終位置
                const finalX = Math.round(charBaseX + pixelX);
                const finalY = Math.round(baseTextStartY - pixelY);
                
                // 檢查是否需要裁切 - 基於最終位置和顯示區域邊界
                let shouldRender = true;
                const displayStartX = currentX + leftPaddingPixels;
                const displayEndX = displayStartX + displayContentWidth;
                
                // 在跑馬燈模式下，文字可以滾動到邊界外
                if (marqueeData.needsMarquee && (isMarqueeActive || marqueeOffset > 0)) {
                  // 邊界檢查 - 像素完全超出顯示區域時不渲染
                  const pixelStartX = finalX;
                  const pixelEndX = finalX + pixelSize;
                  
                  // 像素完全在左邊界外，或起始位置在右邊界外時不渲染
                  if (pixelEndX <= displayStartX || pixelStartX >= displayEndX) {
                    shouldRender = false;
                  }
                } else {
                  // 正常模式不需要特殊的裁切邏輯，因為字符選擇已經限制了顯示範圍
                }
                
                if (shouldRender) {
                  // 建立像素實例（使用反轉顏色）
                  const pixelMesh = new THREE.Mesh(pixelGeometry, textBoxPixelMaterial);
                  
                  pixelMesh.position.set(finalX, finalY, 0.1); // 文字放在前面
                  scene.add(pixelMesh);
                }
              }
            });
          });
        });
      }
    }
  }, [sceneData, displayText, text, textEnabled, displayTextBox, textBox, textBoxEnabled, textBoxWidth, textBoxPadding, pixelSize, pixelGap, letterSpacing, primaryColor, onPrimaryColor, pixelGeometry, pixelMaterial, textBoxPixelMaterial, textBoxBackgroundMaterial, initializeThreeJS, marqueeData.needsMarquee, marqueeData.cycleLength, isMarqueeActive, marqueeOffset, getCharWidth]);

  // 渲染場景
  const render = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  // 重新調整大小
  const handleResize = () => {
    if (!rendererRef.current || !cameraRef.current) return;
    
    rendererRef.current.setSize(width, height);
    
    // 更新相機
    cameraRef.current.left = -width / 2;
    cameraRef.current.right = width / 2;
    cameraRef.current.top = height / 2;
    cameraRef.current.bottom = -height / 2;
    cameraRef.current.updateProjectionMatrix();
    
    render();
  };

  // 當文字改變時處理動畫或直接更新
  useEffect(() => {
    if (animated) {
      startAnimation();
    } else {
      setDisplayText(text);
      setDisplayTextBox(textBox);
    }
  }, [text, textEnabled, textBox, textBoxEnabled, animated, startAnimation]);

  // 當顯示文字或樣式改變時重新建立
  useEffect(() => {
    createPixelText();
    render();
  }, [createPixelText]);

  // 當尺寸改變時重新調整
  useEffect(() => {
    handleResize();
  }, [width, height]);

  // 跑馬燈管理 - 當動畫結束且需要跑馬燈時自動啟動
  useEffect(() => {
    if (!isAnimating && marqueeData.needsMarquee && !isMarqueeActive) {
      // 立即啟動跑馬燈
      startMarquee();
    } else if (!marqueeData.needsMarquee && isMarqueeActive) {
      // 不需要跑馬燈時停止它
      stopMarquee();
    }
  }, [isAnimating, marqueeData.needsMarquee, isMarqueeActive, startMarquee, stopMarquee]);

  // 當頁面隱藏或顯示時暫停/恢復動畫（避免背景頁面耗電）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopMarquee();
        clearAnimationTimers();
      } else {
        // 僅在需要時恢復跑馬燈（且未在動畫中）
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

  // 當元件離開視窗可見範圍時暫停動畫（節省行動裝置資源）
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
      // 清除動畫計時器（包括跑馬燈）
      clearAnimationTimers();
      stopMarquee();
      
      // 清理 Three.js 資源
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }
      
      // 手動清理共用資源
      pixelGeometry.dispose();
      pixelMaterial.dispose();
      textBoxPixelMaterial.dispose();
      textBoxBackgroundMaterial.dispose();
    };
  }, [clearAnimationTimers, stopMarquee, pixelGeometry, pixelMaterial, textBoxPixelMaterial, textBoxBackgroundMaterial]);

  // 警告不支援的字符
  useEffect(() => {
    if (textEnabled && text) {
      const unsupportedChars = Array.from(text).filter(char => !isCharacterSupported(char));
      if (unsupportedChars.length > 0) {
        console.warn(`PixelText: 以下字符不支援: ${unsupportedChars.join(', ')}`);
      }
    }
    
    if (textBoxEnabled && textBox) {
      const unsupportedChars = Array.from(textBox).filter(char => !isCharacterSupported(char));
      if (unsupportedChars.length > 0) {
        console.warn(`PixelText textBox: 以下字符不支援: ${unsupportedChars.join(', ')}`);
      }
    }
  }, [text, textEnabled, textBox, textBoxEnabled]);

  return (
    <div 
      ref={ref || containerRef}
      className={`pixel-text ${animated ? 'animated' : ''} ${isAnimating ? 'animating' : ''} ${className}`}
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

PixelText.displayName = 'PixelText';

export default PixelText;
