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
}

const PixelText = forwardRef<HTMLDivElement, PixelTextProps>(({
  text = '',
  textEnabled = true,
  pixelSize = 4,
  pixelGap = 1,
  primaryColor = '#000000',
  onPrimaryColor = '#FFFFFF',
  letterSpacing = 2,
  width = 400,
  height = 100,
  antialias = false,
  className = '',
  animated = false,
  durationTime = 1000,
  animationDelay = 100,
  glitchInterval = 20,
  easeGlitch = true,
  textBoxEnabled = false,
  textBox = '',
  textBoxWidth = 5,
  textBoxPadding = 2,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const animationTimersRef = useRef<NodeJS.Timeout[]>([]);
  const glitchTimersRef = useRef<NodeJS.Timeout[]>([]);

  // 動畫狀態管理
  const [displayText, setDisplayText] = useState(text);
  const [displayTextBox, setDisplayTextBox] = useState(textBox);
  const [isAnimating, setIsAnimating] = useState(false);

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
      const textCharWidth = charCount * CHAR_WIDTH * pixelWithGap - charCount * pixelGap;
      const textSpacing = (charCount - 1) * letterSpacing;
      totalWidth = textCharWidth + textSpacing * pixelSize;
    }

    // 計算 text-box 寬度（如果啟用且有內容的話）
    if (textBoxEnabled && (currentTextBox || textBoxWidth > 0)) {
      const boxCharCount = textBoxWidth;
      const boxCharWidth = boxCharCount * CHAR_WIDTH * pixelWithGap - boxCharCount * pixelGap;
      const boxSpacing = Math.max(0, boxCharCount - 1) * letterSpacing;
      const boxContentWidth = boxCharWidth + boxSpacing * pixelSize;
      
      // 加入 padding（左右各加 textBoxPadding * pixelSize）
      const boxTotalWidth = boxContentWidth + (textBoxPadding * 2 * pixelSize);
      
      // 如果同時有主文字和 text-box，需要加上間隔（使用 textBoxPadding 作為間距）
      if (textEnabled && currentText) {
        totalWidth += textBoxPadding * pixelSize; // 主文字和 text-box 之間的間隔
      }
      
      totalWidth += boxTotalWidth;
      charCount += boxCharCount;
    }

    return { totalWidth, totalHeight, charCount };
  }, [displayText, text, textEnabled, displayTextBox, textBox, textBoxEnabled, textBoxWidth, textBoxPadding, pixelSize, pixelGap, letterSpacing]);

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
      
      // 如果是最後一個字符，標記動畫結束
      if (charIndex === text.length - 1) {
        setTimeout(() => setIsAnimating(false), 100);
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
      
      // 如果是最後一個字符且沒有主文字，標記動畫結束
      if (charIndex === (textBox?.length || 0) - 1 && !text) {
        setTimeout(() => setIsAnimating(false), 100);
      }
    }
  }, [getRandomChar, glitchInterval, textBox, text]);

  // 開始文字動畫
  const startAnimation = useCallback(() => {
    if (!animated || (!(textEnabled && text) && !(textBoxEnabled && textBox))) return;

    setIsAnimating(true);
    
    // 清除之前的計時器
    clearAnimationTimers();

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
          
          // 如果是最後一個字符，標記動畫結束
          if (index === text.length - 1) {
            setTimeout(() => setIsAnimating(false), 100);
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
            
            // 如果是最後一個字符，標記動畫結束
            if (index === textBox.length - 1 && !text) {
              setTimeout(() => setIsAnimating(false), 100);
            }
          }, finalTime);
          
          // 保存計時器以便清理
          animationTimersRef.current.push(finalTimer);
          glitchTimersRef.current.push(glitchTimer);
        }
      });
    }
  }, [animated, text, textEnabled, textBox, textBoxEnabled, durationTime, animationDelay, glitchInterval, easeGlitch, generateRandomText, clearAnimationTimers, getRandomChar, createEaseGlitch, createEaseGlitchForTextBox]);

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

    // 建立渲染器
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias,
      alpha: true, // 永遠使用透明背景
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比例以提升效能
    rendererRef.current = renderer;

    return { scene, camera, renderer };
  };

  // 建立文字的像素網格
  const createPixelText = useCallback(() => {
    const { scene } = initializeThreeJS() || {};
    if (!scene) return;

    // 清除之前的網格
    while (scene.children.length > 0) {
      const child = scene.children[0];
      scene.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    }

    const currentText = displayText || text;
    const currentTextBox = displayTextBox || textBox;
    
    if (!(textEnabled && currentText) && !(textBoxEnabled && currentTextBox)) return;

    // 計算起始位置以置中文字
    const pixelWithGap = pixelSize + pixelGap;
    const startX = -sceneData.totalWidth / 2 + pixelSize / 2;
    const startY = CHAR_HEIGHT * pixelWithGap / 2 - pixelSize / 2 - pixelGap / 2;

    let currentX = startX;

    // 渲染主文字（如果啟用且有內容的話）
    if (textEnabled && currentText) {
      Array.from(currentText).forEach((char) => {
        const pixelData = getCharacterPixelData(char);
        
        // 為每個像素建立方塊
        pixelData.forEach((row, rowIndex) => {
          row.forEach((pixel, colIndex) => {
            if (pixel === 1) {
              // 建立像素實例
              const pixelMesh = new THREE.Mesh(pixelGeometry, pixelMaterial);
              
              // 計算位置 - 加入 pixelGap 間距
              const x = currentX + colIndex * pixelWithGap;
              const y = startY - rowIndex * pixelWithGap;
              
              pixelMesh.position.set(x, y, 0);
              scene.add(pixelMesh);
            }
          });
        });

        // 移動到下一個字符位置
        currentX += CHAR_WIDTH * pixelWithGap + letterSpacing * pixelSize;
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
      const totalContentWidth = boxContentWidth + boxContentSpacing;
      
      // 計算包含 padding 的背景尺寸
      const paddingPixels = textBoxPadding * pixelSize;
      const backgroundWidth = totalContentWidth + (paddingPixels * 2);
      const backgroundHeight = CHAR_HEIGHT * pixelWithGap - pixelGap + (paddingPixels * 2);
      
      // 渲染 text-box 背景（包含 padding）
      const bgStartX = currentX; // 從當前位置開始（已包含間距）
      const bgStartY = startY + paddingPixels;
      
      for (let row = 0; row < Math.ceil(backgroundHeight / pixelWithGap); row++) {
        for (let col = 0; col < Math.ceil(backgroundWidth / pixelWithGap); col++) {
          const bgMesh = new THREE.Mesh(pixelGeometry, textBoxBackgroundMaterial);
          const x = bgStartX + col * pixelWithGap;
          const y = bgStartY - row * pixelWithGap;
          bgMesh.position.set(x, y, -0.1); // 背景放在後面
          scene.add(bgMesh);
        }
      }

      // 渲染 text-box 文字內容（置中）
      if (currentTextBox) {
        // 計算實際要顯示的文字（不超過 textBoxWidth）
        const displayableText = currentTextBox.slice(0, textBoxWidth);
        
        // 計算文字的實際寬度
        const textCharCount = displayableText.length;
        const textActualWidth = textCharCount * CHAR_WIDTH * pixelWithGap - textCharCount * pixelGap;
        const textSpacingWidth = Math.max(0, textCharCount - 1) * letterSpacing * pixelSize;
        const totalTextWidth = textActualWidth + textSpacingWidth;
        
        // 計算水平置中的起始位置
        const availableWidth = totalContentWidth;
        const horizontalOffset = (availableWidth - totalTextWidth) / 2;
        const textStartX = currentX + paddingPixels + horizontalOffset; // 加上 padding 偏移
        
        // 計算垂直置中的起始位置
        const textHeight = CHAR_HEIGHT * pixelWithGap - pixelGap;
        const availableHeight = CHAR_HEIGHT * pixelWithGap - pixelGap;
        const verticalOffset = (availableHeight - textHeight) / 2;
        const textStartY = startY - verticalOffset;
        
        let textBoxCurrentX = textStartX;
        
        Array.from(displayableText).forEach((char) => {
          const pixelData = getCharacterPixelData(char);
          
          // 為每個像素建立方塊
          pixelData.forEach((row, rowIndex) => {
            row.forEach((pixel, colIndex) => {
              if (pixel === 1) {
                // 建立像素實例（使用反轉顏色）
                const pixelMesh = new THREE.Mesh(pixelGeometry, textBoxPixelMaterial);
                
                // 計算位置 - 加入 pixelGap 間距
                const x = textBoxCurrentX + colIndex * pixelWithGap;
                const y = textStartY - rowIndex * pixelWithGap;
                
                pixelMesh.position.set(x, y, 0.1); // 文字放在前面
                scene.add(pixelMesh);
              }
            });
          });

          // 移動到下一個字符位置
          textBoxCurrentX += CHAR_WIDTH * pixelWithGap + letterSpacing * pixelSize;
        });
      }
    }
  }, [sceneData, displayText, text, textEnabled, displayTextBox, textBox, textBoxEnabled, textBoxWidth, textBoxPadding, pixelSize, pixelGap, letterSpacing, primaryColor, onPrimaryColor, pixelGeometry, pixelMaterial, textBoxPixelMaterial, textBoxBackgroundMaterial, initializeThreeJS]);

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

  // 清理資源
  useEffect(() => {
    return () => {
      // 清除動畫計時器
      clearAnimationTimers();
      
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
  }, [clearAnimationTimers, pixelGeometry, pixelMaterial, textBoxPixelMaterial, textBoxBackgroundMaterial]);

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
