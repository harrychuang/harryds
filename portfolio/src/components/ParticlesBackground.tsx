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
      vx: (Math.random() - 0.5) * 0.3, // 輕微的水平漂移
      life: randomLife ? Math.random() : 0, // 初始化時可以隨機生命值，讓粒子不會同時出現
      lifeSpeed: 0.0008 + Math.random() * 0.0012, // 生命消耗速度（調慢一些）
      fadeInDuration: 0.15 + Math.random() * 0.1, // fade in 階段 (0.15-0.25)
      fadeOutStart: 0.7 + Math.random() * 0.15, // fade out 開始點 (0.7-0.85)
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
      // 更新生命值
      particle.life += particle.lifeSpeed;
      
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
    
    // 繪製每個粒子（正方形）
    particlesRef.current.forEach((particle) => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.opacity;
      // 繪製正方形，中心點為 (particle.x, particle.y)
      ctx.fillRect(
        particle.x - particle.size / 2,
        particle.y - particle.size / 2,
        particle.size,
        particle.size
      );
    });
    
    ctx.globalAlpha = 1;
  }, [backgroundColor]);

  // 動畫循環
  const animate = useCallback(() => {
    updateParticles();
    drawParticles();
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [updateParticles, drawParticles]);

  // 處理視窗大小變化
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 重新初始化粒子
    initParticles();
  }, [initParticles]);

  // 初始化 Canvas 和動畫
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // 設置 Canvas 尺寸
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 初始化粒子
    initParticles();
    
    // 開始動畫
    animate();
    
    // 監聽視窗大小變化
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [initParticles, animate, handleResize]);

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

