import React, { useEffect, useRef, useState, useCallback } from 'react';
import './TransitionOverlay.scss';
import { audioManager } from '../../../harryds/src/utils/audioManager';
import transitionSoundUrl from '../../assets/sound/8-Bit Game Start Sound.mp3';

interface TransitionOverlayProps {
  isActive: boolean;
  clickPosition?: { x: number; y: number };
  color?: string;
  onComplete?: () => void;
  onFilled?: () => void; // 當動畫填滿整個畫面時的回調
  shouldStartDisappear?: boolean; // 是否應該開始消失動畫（內容載入完成後才 true）
}

const TransitionOverlay: React.FC<TransitionOverlayProps> = ({
  isActive,
  clickPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  color = '#000000',
  onComplete,
  onFilled,
  shouldStartDisappear = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isAnimating, setIsAnimating] = useState(false);
  const hasCalledFilledRef = useRef(false);
  const disappearStartTimeRef = useRef<number | null>(null);
  // 使用 ref 來追蹤最新的 shouldStartDisappear 值，避免閉包問題
  const shouldStartDisappearRef = useRef(shouldStartDisappear);

  const easeOutQuart = useCallback((t: number): number => {
    return 1 - Math.pow(1 - t, 4);
  }, []);

  const playTransitionSound = useCallback(async () => {
    try {
      // 使用一個適合的 8-bit 音效
      await audioManager.play(transitionSoundUrl, { 
        volume: 0.5 
      });
    } catch (err) {
      console.warn('Transition sound play failed:', err);
    }
  }, []);

  const startAnimation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 效能優化：使用 willReadFrequently 提示
    const ctx = canvas.getContext('2d', { 
      alpha: true,
      willReadFrequently: false 
    });
    if (!ctx) return;

    // 設置 canvas 大小
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 重置填滿回調標記
    hasCalledFilledRef.current = false;

    const pixelSize = 80; // 8-bit 風格的像素大小（增大讓效果更明顯）
    const cols = Math.ceil(canvas.width / pixelSize);
    const rows = Math.ceil(canvas.height / pixelSize);
    
    const centerX = clickPosition.x;
    const centerY = clickPosition.y;
    
    // 計算最大距離
    const maxDistance = Math.sqrt(
      Math.pow(Math.max(centerX, canvas.width - centerX), 2) +
      Math.pow(Math.max(centerY, canvas.height - centerY), 2)
    );

    // 效能優化：為每個像素預先生成隨機消失時間（使用陣列比 Map 更快）
    const pixelDisappearTimes: number[][] = [];
    for (let row = 0; row < rows; row++) {
      pixelDisappearTimes[row] = [];
      for (let col = 0; col < cols; col++) {
        pixelDisappearTimes[row][col] = Math.random();
      }
    }
    
    // 效能優化：預先計算每個像素的距離
    const pixelDistances: number[][] = [];
    for (let row = 0; row < rows; row++) {
      pixelDistances[row] = [];
      for (let col = 0; col < cols; col++) {
        const x = col * pixelSize;
        const y = row * pixelSize;
        const pixelCenterX = x + pixelSize / 2;
        const pixelCenterY = y + pixelSize / 2;
        
        const distance = Math.sqrt(
          Math.pow(pixelCenterX - centerX, 2) +
          Math.pow(pixelCenterY - centerY, 2)
        );
        pixelDistances[row][col] = distance / maxDistance;
      }
    }

    const expandDuration = 250; // 擴展階段持續時間
    const disappearDuration = 500; // 消失階段持續時間
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      // 計算擴展進度（0-1）
      const expandProgress = Math.min(elapsed / expandDuration, 1);
      
      // 計算消失進度：只有在 shouldStartDisappear 為 true 後才開始計算
      // 使用 ref 來獲取最新的值，避免閉包問題
      let disappearProgress = 0;
      if (shouldStartDisappearRef.current) {
        if (disappearStartTimeRef.current === null) {
          // 記錄開始消失的時間
          console.log('[TransitionOverlay] 開始消失動畫');
          disappearStartTimeRef.current = Date.now();
        }
        const disappearElapsed = Date.now() - disappearStartTimeRef.current;
        disappearProgress = Math.min(disappearElapsed / disappearDuration, 1);
      }

      // 當動畫填滿畫面時（擴展完成），通知外部
      if (expandProgress >= 0.98 && !hasCalledFilledRef.current) {
        hasCalledFilledRef.current = true;
        onFilled?.();
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 使用 easing 函數讓動畫更有趣
      const easedExpandProgress = easeOutQuart(expandProgress);
      
      // 繪製像素化的圓形擴展效果（效能優化：使用預計算的距離）
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const normalizedDistance = pixelDistances[row][col];
          
          // 當擴展波到達這個像素時才顯示（效能優化：提前跳出）
          if (easedExpandProgress < normalizedDistance) continue;
          
          // 計算這個像素的透明度（擴展階段）
          const distanceRatio = (easedExpandProgress - normalizedDistance) * 5;
          let alpha = Math.min(1, distanceRatio);
          
          // 消失階段：根據隨機時間讓像素消失
          if (disappearProgress > 0) {
            const pixelDisappearTime = pixelDisappearTimes[row][col];
            
            // 當消失進度超過這個像素的隨機時間時，開始消失
            if (disappearProgress > pixelDisappearTime) {
              const fadeOutProgress = (disappearProgress - pixelDisappearTime) / (1 - pixelDisappearTime);
              alpha *= (1 - fadeOutProgress);
            }
          }
          
          // 效能優化：提前跳過幾乎透明的像素
          if (alpha <= 0.05) continue;
          
          const x = col * pixelSize;
          const y = row * pixelSize;
          
          // 效能優化：減少 Math.random() 的調用次數（閃爍效果）
          const shouldFlicker = disappearProgress === 0 && alpha < 0.8 && (row + col) % 17 === 0;
          
          if (!shouldFlicker) {
            // 添加 RGB 分離效果（色彩失真）- 更明顯的效果
            const offset = pixelSize * 0.15;
            const chromaAlpha = alpha * 0.4;
            
            // 紅色通道
            ctx.fillStyle = `rgba(255, 0, 0, ${chromaAlpha})`;
            ctx.fillRect(x - offset, y, pixelSize, pixelSize);
            
            // 藍色通道
            ctx.fillStyle = `rgba(0, 0, 255, ${chromaAlpha})`;
            ctx.fillRect(x + offset, y, pixelSize, pixelSize);
            
            // 主色塊 - 添加像素邊緣效果
            ctx.fillStyle = color;
            ctx.globalAlpha = alpha;
            ctx.fillRect(x + 1, y + 1, pixelSize - 0, pixelSize - 0);
            
            ctx.globalAlpha = 1;
          }
        }
      }

      // 添加掃描線效果（在消失階段淡出）
      if (expandProgress > 0.3) {
        const scanlineAlpha = disappearProgress > 0 ? 0.1 * (1 - disappearProgress) : 0.1;
        ctx.fillStyle = `rgba(0, 0, 0, ${scanlineAlpha})`;
        for (let i = 0; i < canvas.height; i += 4) {
          ctx.fillRect(0, i, canvas.width, 2);
        }
      }

      // 繼續動畫：如果還沒開始消失，或者正在消失但還沒完成
      // 使用 ref 來獲取最新的值
      const shouldContinue = !shouldStartDisappearRef.current || (shouldStartDisappearRef.current && disappearProgress < 1);
      
      if (shouldContinue) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // 消失動畫完成
        console.log('[TransitionOverlay] 動畫完成');
        setTimeout(() => {
          setIsAnimating(false);
          disappearStartTimeRef.current = null; // 重置消失開始時間
          hasCalledFilledRef.current = false; // 重置填滿回調標記
          onComplete?.();
        }, 50);
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // 注意：不包含 shouldStartDisappear，因為我們使用 ref 來追蹤它的最新值
    // 避免當它改變時重新啟動動畫
  }, [clickPosition, color, onComplete, onFilled, easeOutQuart]);

  // 同步 shouldStartDisappear 到 ref
  useEffect(() => {
    shouldStartDisappearRef.current = shouldStartDisappear;
    console.log('[TransitionOverlay] shouldStartDisappear changed to:', shouldStartDisappear);
  }, [shouldStartDisappear]);

  useEffect(() => {
    if (isActive && !isAnimating) {
      setIsAnimating(true);
      hasCalledFilledRef.current = false;
      disappearStartTimeRef.current = null;
      shouldStartDisappearRef.current = false; // 初始化為 false
      playTransitionSound();
      startAnimation();
    }
  }, [isActive, isAnimating, startAnimation, playTransitionSound]);

  // 如果動畫未激活且未進行中，不渲染任何內容
  if (!isActive && !isAnimating) {
    console.log('[TransitionOverlay] Not rendering (isActive:', isActive, 'isAnimating:', isAnimating, ')');
    return null;
  }

  console.log('[TransitionOverlay] Rendering overlay (isActive:', isActive, 'isAnimating:', isAnimating, ')');

  return (
    <div className="transition-overlay">
      <canvas 
        ref={canvasRef}
        className="transition-canvas"
      />
      {/* CRT 效果層 */}
      <div className="crt-effect" />
    </div>
  );
};

export default TransitionOverlay;

