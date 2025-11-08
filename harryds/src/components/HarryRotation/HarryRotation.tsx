// =============================================================================
// HARRY ROTATION 元件 - 循環播放圖片序列形成動畫效果
// =============================================================================

import { useEffect, useRef, useState } from 'react';
import './HarryRotation.scss';

export interface HarryRotationProps {
  /** 每幀的持續時間（毫秒），預設 300ms */
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
  /** 手動控制當前影格（0-9），如果設定此值會覆蓋自動播放 */
  frame?: number;
}

// 引入圖片
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

const frames = [
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

export const HarryRotation: React.FC<HarryRotationProps> = ({
  frameDuration = 300,
  width = '100%',
  height = 'auto',
  autoPlay = true,
  className = '',
  objectFit = 'contain',
  frame,
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 如果有手動設定 frame，就不自動播放
    if (frame !== undefined || !autoPlay) return;

    // 設置間隔計時器
    intervalRef.current = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % frames.length);
    }, frameDuration);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [frameDuration, autoPlay, frame]);

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
    <div className={`harry-rotation ${className}`} style={containerStyle}>
      <img
        src={frames[displayFrame]}
        alt={`Harry rotation frame ${displayFrame}`}
        style={imgStyle}
        className="harry-rotation__image"
      />
    </div>
  );
};

export default HarryRotation;

