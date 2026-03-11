// =============================================================================
// HARRY ANIMATION 元件 - 循環播放圖片序列形成動畫效果
// =============================================================================

import { useEffect, useRef, useState } from 'react';
import './HarryAnimation.scss';

export type HarryAnimationType = 'rotation' | 'usemac';

export interface HarryAnimationProps {
  /** 動畫類型，預設 'rotation' */
  type?: HarryAnimationType;
  /** 每幀的持續時間（毫秒），rotation 預設 300ms，usemac 預設 2000ms */
  frameDuration?: number;
  /** 圖片寬度，預設 '100%' */
  width?: string | number;
  /** 圖片高度，預設 'auto' */
  height?: string | number;
  /** 是否自動播放，預設 true */
  autoPlay?: boolean;
  /** 額外的 CSS 類名 */
  className?: string;
  /** 圖片 object-fit 模式 */
  objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
  /** 手動控制當前影格，如果設定此值會覆蓋自動播放 */
  frame?: number;
  /** 是否啟用 pixel particle 效果，預設 false */
  enableParticles?: boolean;
}

interface Particle {
  id: number;
  x: number; // 位置 (%)
  y: number; // 位置 (%)
  size: number; // 尺寸 (px)
  color: string; // 顏色
  duration: number; // 動畫持續時間 (ms)
  delay: number; // 延遲時間 (ms)
}

interface ValidPixel {
  x: number; // 0-1
  y: number; // 0-1
  color: string; // rgba
}

// 引入 rotation 圖片
import rotation0 from '../../../assets/imgs/me/rotation-0.png';
import rotation1 from '../../../assets/imgs/me/rotation-1.png';
import rotation2 from '../../../assets/imgs/me/rotation-2.png';
import rotation3 from '../../../assets/imgs/me/rotation-3.png';
import rotation4 from '../../../assets/imgs/me/rotation-4.png';
import rotation5 from '../../../assets/imgs/me/rotation-5.png';
import rotation6 from '../../../assets/imgs/me/rotation-6.png';
import rotation7 from '../../../assets/imgs/me/rotation-7.png';
import rotation8 from '../../../assets/imgs/me/rotation-8.png';
import rotation9 from '../../../assets/imgs/me/rotation-9.png';

// 引入 usemac 圖片
import useMac01 from '../../../assets/imgs/usemac/use-mac-01.png';
import useMac02 from '../../../assets/imgs/usemac/use-mac-02.png';

const rotationFrames = [
  rotation0,
  rotation1,
  rotation2,
  rotation3,
  rotation4,
  rotation5,
  rotation6,
  rotation7,
  rotation8,
  rotation9,
];

const usemacFrames = [
  useMac01,
  useMac02,
];

export const HarryAnimation: React.FC<HarryAnimationProps> = ({
  type = 'rotation',
  frameDuration,
  width = '100%',
  height = 'auto',
  autoPlay = true,
  className = '',
  objectFit = 'contain',
  frame,
  enableParticles = false,
}) => {
  // 根據 type 選擇對應的 frames 陣列
  const frames = type === 'usemac' ? usemacFrames : rotationFrames;
  
  // 根據 type 設定預設的 frameDuration
  const defaultFrameDuration = type === 'usemac' ? 2000 : 300;
  const actualFrameDuration = frameDuration ?? defaultFrameDuration;

  const [currentFrame, setCurrentFrame] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [validPixels, setValidPixels] = useState<ValidPixel[]>([]);

  useEffect(() => {
    // 如果有手動設定 frame，就不自動播放
    if (frame !== undefined || !autoPlay) return;

    // 設置間隔計時器
    intervalRef.current = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % frames.length);
    }, actualFrameDuration);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [actualFrameDuration, autoPlay, frame, frames.length]);

  // 分析圖片像素，找出非透明區域
  useEffect(() => {
    if (!enableParticles || !imageRef.current) return;

    const analyzeImage = () => {
      const img = imageRef.current;
      if (!img || !img.complete) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // 設定 canvas 尺寸（降低取樣率以提升性能）
      const sampleRate = 0.2; // 取樣率 20%
      canvas.width = img.naturalWidth * sampleRate;
      canvas.height = img.naturalHeight * sampleRate;

      // 繪製圖片到 canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const validPixelsList: ValidPixel[] = [];

        // 每隔幾個像素取樣一次（進一步降低數據量）
        const step = 4;
        for (let y = 0; y < canvas.height; y += step) {
          for (let x = 0; x < canvas.width; x += step) {
            const i = (y * canvas.width + x) * 4;
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            // 只保留非透明像素（alpha > 50）
            if (a > 50) {
              validPixelsList.push({
                x: x / canvas.width,
                y: y / canvas.height,
                color: `rgba(${r}, ${g}, ${b}, ${a / 255})`,
              });
            }
          }
        }

        setValidPixels(validPixelsList);
      } catch (error) {
        console.error('Error analyzing image:', error);
        // 如果分析失敗（可能是 CORS 問題），使用整個區域
        setValidPixels([
          { x: 0.5, y: 0.5, color: 'rgba(0, 0, 0, 1)' }
        ]);
      }
    };

    // 如果圖片已經載入，立即分析
    if (imageRef.current.complete) {
      analyzeImage();
    } else {
      // 否則等待圖片載入
      imageRef.current.addEventListener('load', analyzeImage);
      return () => {
        imageRef.current?.removeEventListener('load', analyzeImage);
      };
    }
  }, [enableParticles, currentFrame, frame]);

  // Particle 效果
  useEffect(() => {
    if (!enableParticles || !containerRef.current || validPixels.length === 0) return;

    // 生成隨機 particle
    const generateParticle = (id: number): Particle => {
      const containerWidth = containerRef.current?.offsetWidth || 300;
      const baseSize = containerWidth / 50; // 圖片寬度的 1/20
      const sizeVariation = baseSize * 0.5; // ±50%
      
      // 從有效像素中隨機選擇一個位置
      const randomPixel = validPixels[Math.floor(Math.random() * validPixels.length)];
      
      // 使用圖片中的顏色，但調整為灰階（保持原本的想法）
      // 或者可以選擇：直接使用圖片顏色 randomPixel.color
      const colors = ['#111111', '#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#999999'];
      
      return {
        id,
        x: randomPixel.x * 100, // 轉換為百分比
        y: randomPixel.y * 100, // 轉換為百分比
        size: baseSize + (Math.random() * 2 - 1) * sizeVariation, // baseSize ± 10%
        color: colors[Math.floor(Math.random() * colors.length)],
        duration: 1000 + Math.random() * 2000, // 2-4秒
        delay: Math.random() * 1000, // 0-1秒延遲
      };
    };

    // 初始化 particles
    const particleCount = Math.floor(Math.random() * 60) + 40; // 100-150
    const initialParticles = Array.from({ length: particleCount }, (_, i) => generateParticle(i));
    setParticles(initialParticles);

    // 定期更新 particles
    const particleInterval = setInterval(() => {
      setParticles((prev) => {
        // 隨機替換一些 particles
        const updatedParticles = [...prev];
        const replaceCount = Math.floor(Math.random() * 5) + 1; // 每次替換 1-5 個
        
        for (let i = 0; i < replaceCount; i++) {
          const randomIndex = Math.floor(Math.random() * updatedParticles.length);
          updatedParticles[randomIndex] = generateParticle(Date.now() + i);
        }
        
        return updatedParticles;
      });
    }, 2000); // 每 3 秒更新一批

    return () => {
      clearInterval(particleInterval);
    };
  }, [enableParticles, validPixels]);

  const containerStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const imgStyle: React.CSSProperties = {
    objectFit,
  };

  // 如果有手動設定 frame，使用它；否則使用內部 state
  const displayFrame = frame !== undefined 
    ? Math.max(0, Math.min(frames.length - 1, Math.floor(frame))) 
    : currentFrame;

  return (
    <div 
      ref={containerRef}
      className={`harry-animation harry-animation--${type} ${className}`} 
      style={containerStyle}
    >
      {frames.map((frameSrc, index) => (
        <img
          key={index}
          ref={(el) => {
            if (index === displayFrame) {
              imageRef.current = el;
            }
          }}
          src={frameSrc}
          alt={index === displayFrame ? `Harry ${type} animation frame ${index}` : ''}
          style={{
            ...imgStyle,
            ...(index !== 0 ? {
              position: 'absolute' as const,
              top: 0,
              left: 0,
            } : {}),
            opacity: index === displayFrame ? 1 : 0,
            pointerEvents: index === displayFrame ? 'auto' : 'none',
          }}
          className="harry-animation__image"
          crossOrigin="anonymous"
        />
      ))}
      
      {enableParticles && (
        <div className="harry-animation__particles">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="harry-animation__particle"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                animationDuration: `${particle.duration}ms`,
                animationDelay: `${particle.delay}ms`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HarryAnimation;

