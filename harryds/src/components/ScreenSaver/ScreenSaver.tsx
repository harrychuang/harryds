// =============================================================================
// SCREEN SAVER 組件 - 照片飄落螢幕保護程式效果
// =============================================================================
// 照片一張一張緩慢從畫面上方飄落
// - 使用 CSS transform 動畫確保 GPU 加速
// - 間隔式產生照片，營造優雅的飄落感
// - 智慧位置計算，避免照片重疊
// =============================================================================

import { useEffect, useRef, useState } from 'react';
import './ScreenSaver.scss';

export interface FallingPhoto {
  id: number;
  src: string;
  x: number;           // 水平位置 (%)
  duration: number;    // 飄落時間 (s)
  size: number;        // 照片大小 (vw)
  rotation: number;    // 輕微旋轉角度 (deg)
  swayAmount: number;  // 輕微左右搖擺幅度 (px)
  startTime: number;   // 開始時間（用於計算當前位置）
}

export interface ScreenSaverProps {
  /** 照片 URL 陣列 */
  images: string[];
  /** 每隔多少秒產生一張新照片，預設 3 秒 */
  spawnInterval?: number;
  /** 照片大小範圍 [min, max] (vw)，預設 [10, 20] */
  sizeRange?: [number, number];
  /** 飄落時間範圍 [min, max] (秒)，預設 [20, 35] */
  durationRange?: [number, number];
  /** 是否啟用，預設 true */
  active?: boolean;
  /** z-index 值，預設 9999 */
  zIndex?: number;
  /** 背景顏色，預設 #000000 */
  backgroundColor?: string;
  /** 點擊關閉時的回呼 */
  onClose?: () => void;
  /** 是否顯示關閉按鈕，預設 true */
  showCloseButton?: boolean;
  /** 從中隨機挑選的照片數量，預設 100 張（避免流量過大） */
  randomCount?: number;
  /** 最大同時顯示的照片數量，預設 12 */
  maxPhotos?: number;
}

// 工具函數：產生隨機範圍內的數值
const randomInRange = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};

// 計算照片當前的 Y 位置（百分比，0-100+）
const getPhotoYPosition = (photo: FallingPhoto, currentTime: number): number => {
  const elapsed = (currentTime - photo.startTime) / 1000; // 秒
  const progress = elapsed / photo.duration;
  // Y 從 -size 開始，到 100 + size 結束
  return -photo.size + progress * (100 + photo.size * 2);
};

// 檢查兩個區間是否重疊
const isOverlapping = (
  x1: number, width1: number,
  x2: number, width2: number,
  padding: number = 2 // 額外間距 (%)
): boolean => {
  const left1 = x1 - padding;
  const right1 = x1 + width1 + padding;
  const left2 = x2 - padding;
  const right2 = x2 + width2 + padding;
  return !(right1 < left2 || right2 < left1);
};

// 找到不重疊的 X 位置
const findNonOverlappingX = (
  existingPhotos: FallingPhoto[],
  newSize: number,
  currentTime: number,
  maxAttempts: number = 20
): number | null => {
  const margin = 3; // 邊緣留白 (%)
  const minX = margin;
  const maxX = 100 - newSize - margin;

  // 過濾出畫面上半部的照片（Y < 50%），這些才需要避開
  const nearbyPhotos = existingPhotos.filter(photo => {
    const y = getPhotoYPosition(photo, currentTime);
    return y < 30; // 只考慮畫面上方 60% 的照片
  });

  // 嘗試找到不重疊的位置
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidateX = randomInRange(minX, maxX);
    
    let hasOverlap = false;
    for (const photo of nearbyPhotos) {
      if (isOverlapping(candidateX, newSize, photo.x, photo.size)) {
        hasOverlap = true;
        break;
      }
    }
    
    if (!hasOverlap) {
      return candidateX;
    }
  }

  // 如果找不到，嘗試系統性地尋找空位
  const segments = 10;
  const segmentWidth = (maxX - minX) / segments;
  const shuffledSegments = Array.from({ length: segments }, (_, i) => i)
    .sort(() => Math.random() - 0.5);

  for (const segIdx of shuffledSegments) {
    const candidateX = minX + segIdx * segmentWidth + segmentWidth / 2;
    
    let hasOverlap = false;
    for (const photo of nearbyPhotos) {
      if (isOverlapping(candidateX, newSize, photo.x, photo.size)) {
        hasOverlap = true;
        break;
      }
    }
    
    if (!hasOverlap) {
      return candidateX;
    }
  }

  // 真的找不到就返回 null
  return null;
};

export const ScreenSaver: React.FC<ScreenSaverProps> = ({
  images,
  spawnInterval = 3,
  sizeRange = [10, 30],
  durationRange = [20, 35],
  active = true,
  zIndex = 9999,
  backgroundColor = '#000000',
  onClose,
  showCloseButton = true,
  randomCount = 100,
  maxPhotos = 12,
}) => {
  const [photos, setPhotos] = useState<FallingPhoto[]>([]);
  
  // 使用 ref 存儲不需要觸發 re-render 的數據
  const imageIndexRef = useRef(0);
  const photoIdRef = useRef(0);
  const shuffledImagesRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInitializedRef = useRef(false);
  const photosRef = useRef<FallingPhoto[]>([]); // 用於計算位置的 ref
  const lastSpawnTimeRef = useRef(0); // 追蹤上次生成時間，防止背景標籤累積執行

  // 同步 photos 到 ref
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  // 移除已完成動畫的照片
  const handleAnimationEnd = (photoId: number) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  // 初始化和清理
  useEffect(() => {
    // 清理函數
    const cleanup = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setPhotos([]);
      isInitializedRef.current = false;
    };

    // 如果不啟用或沒有圖片，清理並返回
    if (!active || !images || images.length === 0) {
      cleanup();
      return;
    }

    // 避免重複初始化
    if (isInitializedRef.current) {
      return;
    }
    isInitializedRef.current = true;

    // 打亂並選擇圖片（只執行一次）
    const shuffled = [...images].sort(() => Math.random() - 0.5);
    const count = Math.min(randomCount, images.length);
    shuffledImagesRef.current = shuffled.slice(0, Math.min(count, images.length));
    imageIndexRef.current = 0;

    // 創建照片的函數
    const createPhoto = (): FallingPhoto | null => {
      const imgs = shuffledImagesRef.current;
      if (imgs.length === 0) return null;

      const currentTime = Date.now();
      const size = randomInRange(sizeRange[0], sizeRange[1]);
      
      // 找到不重疊的 X 位置
      const x = findNonOverlappingX(photosRef.current, size, currentTime);
      
      // 如果找不到位置，跳過這次
      if (x === null) {
        return null;
      }

      photoIdRef.current += 1;
      const src = imgs[imageIndexRef.current % imgs.length];
      imageIndexRef.current += 1;

      return {
        id: photoIdRef.current,
        src,
        x,
        duration: randomInRange(durationRange[0], durationRange[1]),
        size,
        rotation: randomInRange(-6, 6),
        swayAmount: randomInRange(8, 20),
        startTime: currentTime,
      };
    };

    // 產生新照片（帶有時間間隔保護）
    const spawnPhoto = () => {
      const now = Date.now();
      const timeSinceLastSpawn = now - lastSpawnTimeRef.current;
      const minInterval = spawnInterval * 1000 * 0.8; // 允許 20% 的誤差
      
      // 防止背景標籤累積執行：如果距離上次生成時間太短，跳過
      if (lastSpawnTimeRef.current > 0 && timeSinceLastSpawn < minInterval) {
        return;
      }
      
      lastSpawnTimeRef.current = now;
      
      const newPhoto = createPhoto();
      if (!newPhoto) return;

      setPhotos(prev => {
        // 如果已達最大數量，移除最舊的
        const trimmed = prev.length >= maxPhotos ? prev.slice(1) : prev;
        return [...trimmed, newPhoto];
      });
    };

    // 立即產生第一張（不走時間間隔保護）
    const firstPhoto = createPhoto();
    if (firstPhoto) {
      setPhotos([firstPhoto]);
      lastSpawnTimeRef.current = Date.now();
    }

    // 設定定時器
    timerRef.current = setInterval(spawnPhoto, spawnInterval * 1000);

    return cleanup;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, images.length]); // 只依賴 active 和 images.length

  // 處理頁面可見性變化（防止背景標籤問題）
  useEffect(() => {
    if (!active) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 頁面回到前景時，更新最後生成時間
        // 這樣下一次 interval 觸發時不會因為累積而連續生成
        lastSpawnTimeRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [active]);

  // 處理鍵盤 ESC 關閉
  useEffect(() => {
    if (!active || !onClose) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, onClose]);

  if (!active) return null;

  return (
    <div
      className="screen-saver"
      style={{
        zIndex,
        backgroundColor,
      }}
      onClick={onClose}
    >
      {/* 關閉按鈕 */}
      {showCloseButton && onClose && (
        <button
          className="screen-saver__close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="關閉螢幕保護程式"
        >
          ✕
        </button>
      )}

      {/* 飄落的照片 */}
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="screen-saver__photo"
          style={{
            '--x': `${photo.x}%`,
            '--duration': `${photo.duration}s`,
            '--size': `${photo.size}vw`,
            '--rotation': `${photo.rotation}deg`,
            '--sway': `${photo.swayAmount}px`,
          } as React.CSSProperties}
          onAnimationEnd={() => handleAnimationEnd(photo.id)}
        >
          <img
            src={photo.src}
            alt=""
            draggable={false}
          />
        </div>
      ))}

      {/* 提示文字 */}
      <div className="screen-saver__hint">
        按 ESC 或點擊任意處關閉
      </div>
    </div>
  );
};

export default ScreenSaver;
