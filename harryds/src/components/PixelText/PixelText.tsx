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
  /** 每個像素的大小 */
  pixelSize?: number;
  /** 像素之間的間隔 */
  pixelGap?: number;
  /** 像素顏色 */
  color?: string;
  /** 文字之間的字間距 */
  letterSpacing?: number;
  /** Canvas 寬度 */
  width?: number;
  /** Canvas 高度 */
  height?: number;
  /** 是否啟用抗鋸齒 */
  antialias?: boolean;
  /** 背景顏色 */
  backgroundColor?: string;
  /** 元件的 CSS 類名 */
  className?: string;
  /** 是否啟用動畫效果 */
  animated?: boolean;

  /** 字符間的動畫延遲時間（毫秒） */
  animationDelay?: number;
  /** 亂碼跳動間隔時間（毫秒） */
  glitchInterval?: number;
  /** 是否啟用漸慢的亂碼動畫效果 */
  easeGlitch?: boolean;
}

const PixelText = forwardRef<HTMLDivElement, PixelTextProps>(({
  text = '',
  pixelSize = 4,
  pixelGap = 1,
  color = '#000000',
  letterSpacing = 2,
  width = 400,
  height = 100,
  antialias = false,
  backgroundColor = 'transparent',
  className = '',
  animated = false,
  animationDelay = 150,
  glitchInterval = 20,
  easeGlitch = true,
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
  const [isAnimating, setIsAnimating] = useState(false);

  // 計算場景尺寸 - 使用 displayText 而不是 text
  const sceneData = useMemo(() => {
    const currentText = displayText || text;
    if (!currentText) return { totalWidth: 0, totalHeight: 0, charCount: 0 };

    const charCount = currentText.length;
    const pixelWithGap = pixelSize + pixelGap;
    const totalCharWidth = charCount * CHAR_WIDTH * pixelWithGap - charCount * pixelGap; // 最後一個字符不需要間隙
    const totalSpacing = (charCount - 1) * letterSpacing;
    const totalWidth = totalCharWidth + totalSpacing * pixelSize;
    const totalHeight = CHAR_HEIGHT * pixelWithGap - pixelGap; // 最後一行不需要間隙

    return { totalWidth, totalHeight, charCount };
  }, [displayText, text, pixelSize, pixelGap, letterSpacing]);

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

  // 開始文字動畫
  const startAnimation = useCallback(() => {
    if (!animated || !text) return;

    setIsAnimating(true);
    
    // 清除之前的計時器
    clearAnimationTimers();

    // 初始設置為隨機文字
    const initialRandomText = generateRandomText(text.length);
    setDisplayText(initialRandomText);

    const animationStartTime = Date.now();

    // 為每個字符設置快速跳動和最終變換
    text.split('').forEach((targetChar, index) => {
      const finalTime = index * animationDelay; // 何時停止跳動並顯示最終字符
      
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
  }, [animated, text, animationDelay, glitchInterval, easeGlitch, generateRandomText, clearAnimationTimers, getRandomChar, createEaseGlitch]);

  // 建立像素幾何體的材質和幾何體（重用以提升效能）
  const pixelGeometry = useMemo(() => new THREE.PlaneGeometry(pixelSize, pixelSize), [pixelSize]);
  const pixelMaterial = useMemo(() => new THREE.MeshBasicMaterial({ 
    color: new THREE.Color(color) 
  }), [color]);

  // 初始化 Three.js 場景
  const initializeThreeJS = () => {
    if (!canvasRef.current) return;

    // 建立場景
    const scene = new THREE.Scene();
    scene.background = backgroundColor === 'transparent' ? null : new THREE.Color(backgroundColor);
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
      alpha: backgroundColor === 'transparent',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比例以提升效能
    rendererRef.current = renderer;

    return { scene, camera, renderer };
  };

  // 建立文字的像素網格
  const createPixelText = () => {
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
    if (!currentText) return;

    // 計算起始位置以置中文字
    const pixelWithGap = pixelSize + pixelGap;
    const startX = -sceneData.totalWidth / 2 + pixelSize / 2;
    const startY = CHAR_HEIGHT * pixelWithGap / 2 - pixelSize / 2 - pixelGap / 2;

    let currentX = startX;

    // 為每個字符建立像素網格
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
  };

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
    }
  }, [text, animated, startAnimation]);

  // 當顯示文字或樣式改變時重新建立
  useEffect(() => {
    createPixelText();
    render();
  }, [displayText, pixelSize, pixelGap, color, letterSpacing]);

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
    };
  }, [clearAnimationTimers]);

  // 警告不支援的字符
  useEffect(() => {
    if (text) {
      const unsupportedChars = Array.from(text).filter(char => !isCharacterSupported(char));
      if (unsupportedChars.length > 0) {
        console.warn(`PixelText: 以下字符不支援: ${unsupportedChars.join(', ')}`);
      }
    }
  }, [text]);

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
