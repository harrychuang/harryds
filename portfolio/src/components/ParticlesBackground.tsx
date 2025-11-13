// =============================================================================
// PARTICLES BACKGROUND 組件 - Canvas 背景粒子效果
// =============================================================================

import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  startY: number; // 起始 Y 位置
  targetY: number; // 目標 Y 位置（上升後的位置）
  size: number;
  color: string;
  opacity: number;
  vx: number; // 水平速度（輕微漂移）
  life: number; // 當前生命值 (0-1)
  lifeSpeed: number; // 生命消耗速度
  fadeInDuration: number; // fade in 階段 (0-0.2)
  fadeOutStart: number; // fade out 開始點 (0.8-1)
  scaleY: number; // Y 軸縮放（受滾動影響）
}

export interface ParticlesBackgroundProps {
  /** 粒子數量，預設 80 */
  particleCount?: number;
  /** 粒子顏色陣列，預設灰階 */
  colors?: string[];
  /** 粒子大小範圍 [min, max]，預設 [1, 4] */
  sizeRange?: [number, number];
  /** 是否啟用背景效果（固定在背後），預設 true */
  fixed?: boolean;
  /** z-index 值，預設 -1 */
  zIndex?: number;
  /** 背景顏色（如果需要），預設透明 */
  backgroundColor?: string;
}

export const ParticlesBackground: React.FC<ParticlesBackgroundProps> = ({
  particleCount = 80,
  colors = ['#111111', '#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#999999'],
  sizeRange = [1, 4],
  fixed = true,
  zIndex = -1,
  backgroundColor = 'transparent'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  
  // 追蹤滾動速度
  const lastScrollYRef = useRef(0);
  const lastScrollTimeRef = useRef(Date.now());
  const scrollVelocityRef = useRef(0); // 滾動速度（像素/毫秒）
  const scrollInfluenceRef = useRef(1); // 滾動對粒子的影響係數 (0.2-4，1 為正常速度)

  // 隨機生成粒子（在畫面任何位置出現，向上移動 200-400px）
  const createParticle = useCallback((width: number, height: number, randomLife = false): Particle => {
    const [minSize, maxSize] = sizeRange;
    
    // 隨機起始位置（畫面內任何地方）
    const startX = Math.random() * width;
    const startY = Math.random() * height;
    
    // 隨機上升距離（200-400px）
    const riseDistance = 200 + Math.random() * 200;
    const targetY = startY - riseDistance;
    
    return {
      x: startX,
      y: startY,
      startY: startY,
      targetY: targetY,
      size: minSize + Math.random() * (maxSize - minSize),
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0,
      vx: (Math.random() - 0.5) * 0, // 輕微的水平漂移
      life: randomLife ? Math.random() : 0, // 初始化時可以隨機生命值，讓粒子不會同時出現
      lifeSpeed: 0.0008 + Math.random() * 0.0012, // 生命消耗速度（調慢一些）
      fadeInDuration: 0.15 + Math.random() * 0.1, // fade in 階段 (0.15-0.25)
      fadeOutStart: 0.7 + Math.random() * 0.15, // fade out 開始點 (0.7-0.85)
      scaleY: 1, // 初始 Y 軸縮放為 1
    };
  }, [colors, sizeRange]);

  // 初始化粒子（使用隨機生命值讓粒子不會同時出現）
  const initParticles = useCallback(() => {
    if (!canvasRef.current) return;
    
    const { width, height } = canvasRef.current;
    particlesRef.current = Array.from({ length: particleCount }, () => 
      createParticle(width, height, true) // randomLife = true
    );
  }, [particleCount, createParticle]);

  // 更新粒子位置和狀態（每個粒子獨立管理生命周期）
  const updateParticles = useCallback(() => {
    if (!canvasRef.current) return;
    
    const { width, height } = canvasRef.current;
    
    particlesRef.current.forEach((particle, index) => {
      // 更新生命值（受滾動速度影響）
      const scrollInfluence = scrollInfluenceRef.current;
      particle.life += particle.lifeSpeed * scrollInfluence;
      
      // 根據滾動影響更新 scaleY（向下滾動時拉長，向上滾動時壓縮）
      if (scrollInfluence > 1) {
        // 向下滾動加速 → Y 軸拉長（scaleY > 1）
        particle.scaleY = 1 + (scrollInfluence - 1) * 0.2;
      } else if (scrollInfluence < 1) {
        // 向上滾動減速 → Y 軸壓縮（scaleY < 1）
        // scrollInfluence 從 1 降到 0.2，scaleY 從 1 降到約 0.4
        particle.scaleY = 0.4 + scrollInfluence * 0.6;
      } else {
        // 沒有滾動 → 恢復正常
        particle.scaleY = 1;
      }
      
      // 如果生命值超過 1，重新初始化該粒子
      if (particle.life >= 1) {
        particlesRef.current[index] = createParticle(width, height, false);
        return;
      }
      
      // 根據生命值計算 Y 位置（從 startY 緩慢移動到 targetY）
      // 使用 easeOut 緩動函數讓移動更平滑
      const easeOutProgress = 1 - Math.pow(1 - particle.life, 2);
      particle.y = particle.startY + (particle.targetY - particle.startY) * easeOutProgress;
      
      // 更新水平位置（輕微漂移）
      particle.x += particle.vx;
      
      // 水平邊界檢測 - 循環回到另一側
      if (particle.x < -particle.size) particle.x = width;
      if (particle.x > width + particle.size) particle.x = 0;
      
      // 計算透明度（fade in -> 維持 -> fade out）
      if (particle.life < particle.fadeInDuration) {
        // Fade in 階段
        particle.opacity = particle.life / particle.fadeInDuration;
      } else if (particle.life > particle.fadeOutStart) {
        // Fade out 階段
        const fadeOutProgress = (particle.life - particle.fadeOutStart) / (1 - particle.fadeOutStart);
        particle.opacity = 1 - fadeOutProgress;
      } else {
        // 維持階段
        particle.opacity = 1;
      }
      
      // 確保透明度在 0-1 之間
      particle.opacity = Math.max(0, Math.min(1, particle.opacity));
    });
  }, [createParticle]);

  // 繪製粒子（正方形）
  const drawParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 清空畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 繪製背景色（如果有）
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // 繪製每個粒子（正方形，帶 Y 軸縮放）
    particlesRef.current.forEach((particle) => {
      ctx.save(); // 保存當前狀態
      
      // 設置透明度和顏色
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.opacity;
      
      // 移動到粒子中心點
      ctx.translate(particle.x, particle.y);
      
      // 應用 Y 軸縮放
      ctx.scale(1, particle.scaleY);
      
      // 繪製正方形（以原點為中心）
      ctx.fillRect(
        -particle.size / 2,
        -particle.size / 2,
        particle.size,
        particle.size
      );
      
      ctx.restore(); // 恢復狀態
    });
    
    ctx.globalAlpha = 1;
  }, [backgroundColor]);

  // 初始化 Canvas 和動畫（只在首次掛載時執行）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // 設置 Canvas 尺寸
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 初始化粒子
    initParticles();
    
    // 開始動畫
    const animateLoop = () => {
      updateParticles();
      drawParticles();
      animationFrameRef.current = requestAnimationFrame(animateLoop);
    };
    animateLoop();
    
    // 監聽視窗大小變化
    const handleResizeEvent = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };
    
    // 監聽滾動事件，計算滾動速度並更新影響係數
    const handleScrollEvent = () => {
      const currentScrollY = window.scrollY;
      const currentTime = Date.now();
      
      const deltaY = currentScrollY - lastScrollYRef.current;
      const deltaTime = currentTime - lastScrollTimeRef.current;
      
      // 計算滾動速度和方向
      if (deltaTime > 0 && Math.abs(deltaY) > 0) {
        scrollVelocityRef.current = Math.abs(deltaY) / deltaTime;
        
        // 根據滾動方向和速度計算影響係數
        if (deltaY > 0) {
          // 向下滾動（內容向上）→ 粒子加速向上（係數 2-20）
          const velocityFactor = Math.min(20, 2 + Math.log1p(scrollVelocityRef.current * 200));
          scrollInfluenceRef.current = velocityFactor;
        } else {
          // 向上滾動（內容向下）→ 粒子減速（係數 0.2-1）
          const velocityFactor = Math.max(0.2, 1 - Math.log1p(scrollVelocityRef.current * 2) * 0.4);
          scrollInfluenceRef.current = velocityFactor;
        }
      }
      
      // 更新記錄
      lastScrollYRef.current = currentScrollY;
      lastScrollTimeRef.current = currentTime;
    };
    
    // 定期衰減影響係數（回到 1）
    const decayInterval = setInterval(() => {
      if (scrollInfluenceRef.current > 1) {
        // 加速狀態 → 逐漸回到 1
        scrollInfluenceRef.current = Math.max(1, scrollInfluenceRef.current * 0.92);
      } else if (scrollInfluenceRef.current < 1) {
        // 減速狀態 → 逐漸回到 1
        scrollInfluenceRef.current = Math.min(1, scrollInfluenceRef.current + (1 - scrollInfluenceRef.current) * 0.08);
      }
    }, 50);
    
    window.addEventListener('resize', handleResizeEvent);
    window.addEventListener('scroll', handleScrollEvent, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleResizeEvent);
      window.removeEventListener('scroll', handleScrollEvent);
      clearInterval(decayInterval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空依賴陣列，只在首次掛載時執行

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: fixed ? 'fixed' : 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex,
        pointerEvents: 'none',
      }}
    />
  );
};

export default ParticlesBackground;

