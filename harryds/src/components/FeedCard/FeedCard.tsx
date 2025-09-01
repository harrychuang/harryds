// =============================================================================
// FEED CARD 元件 - 使用 PixelImage 作為背景的卡片
// 尺寸：hero(600)、med(500)、sm(400)、xs(240)；預設 padding 40，內容水平置中
// FeedCardInfo 預設 max-width 1400px
// =============================================================================

import React, { CSSProperties, createContext, forwardRef, useState, useRef, useEffect } from 'react';
import { PixelImage } from '../PixelImage';
import type { PixelImageProps } from '../PixelImage';
import FeedCardInfo from './FeedCardInfo';
import type { FeedCardInfoData } from './FeedCardInfo';
import type { FeedItem } from '../../types/feed';
import './FeedCard.scss';
import hoverSoundUrl from '../../../assets/sound/Coin Collect Retro 8-bit Sound Effect.mp3';

export type FeedCardSize = 'hero' | 'med' | 'sm' | 'xs';
export const FeedCardHoverContext = createContext<boolean>(false);
export const FeedCardSizeContext = createContext<FeedCardSize>('hero');


export interface FeedCardProps {
  /** 背景圖來源 URL（交由 PixelImage 載入） */
  src: string;
  /** 尺寸分類（預設 hero） */
  size?: FeedCardSize;
  /** 覆寫高度（px）。若提供則優先於 size 預設高度 */
  height?: number;
  /** 內距（px）。預設 40 */
  padding?: number;
  /** 傳遞給 PixelImage 的額外參數（不含 src） */
  backgroundProps?: Partial<Omit<PixelImageProps, 'src'>>;
  /** JSON 的 secondary color（hover 時套用至 PixelImage maskColor） */
  secondaryColor?: string;
  /** 若提供，將自動從 item 取用 src/顏色，且在未提供 children 時自動渲染 FeedCardInfo */
  item?: FeedItem;
  /** 直接提供 FeedCardInfo 資料（覆蓋 item 推導） */
  infoData?: FeedCardInfoData;
  /** FeedCardInfo 的最大寬度（px）。預設 1400 */
  infoMaxWidth?: number;
  /** 額外類名 */
  className?: string;
  /** 內容節點，顯示於卡片左下角 */
  children?: React.ReactNode;
  /** 內聯樣式（少用） */
  style?: CSSProperties;
  /** 啟用滑鼠移入音效（預設 true） */
  enableHoverSound?: boolean;
  /** 音效音量（0-1，預設 0.3） */
  soundVolume?: number;
  /** 強制保持 hovered 狀態 */
  forceHovered?: boolean;
  /** 禁用滑鼠 hover 事件 */
  disableHover?: boolean;
}

const SIZE_TO_HEIGHT: Record<FeedCardSize, number> = {
  hero: 600,
  med: 500,
  sm: 400,
  xs: 240,
};

type FeedCardStyle = CSSProperties & { 
  ['--feed-card-padding']?: string;
  ['--feed-card-info-max-width']?: string;
};

export const FeedCard = forwardRef<HTMLDivElement, FeedCardProps>(({
  src,
  size = 'hero',
  height,
  padding = 40,
  backgroundProps,
  secondaryColor,
  item,
  infoData,
  infoMaxWidth = 1400,
  className = '',
  children,
  style,
  enableHoverSound = true,
  soundVolume = 0.3,
  forceHovered = false,
  disableHover = false,
}, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hasPlayedSoundInCurrentHover, setHasPlayedSoundInCurrentHover] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const computedHeight = Math.max(1, Math.floor(height ?? SIZE_TO_HEIGHT[size]));
  
  // 計算實際的 hover 狀態：forceHovered 優先，否則使用 isHovered
  const actualIsHovered = forceHovered || isHovered;

  // 初始化音效
  useEffect(() => {
    if (enableHoverSound) {
      audioRef.current = new Audio(hoverSoundUrl);
      audioRef.current.preload = 'auto';
      audioRef.current.volume = Math.max(0, Math.min(1, soundVolume)); // 限制音量在 0-1 之間
      
      // 添加載入事件監聽
      audioRef.current.addEventListener('canplaythrough', () => {
        console.log('FeedCard hover sound loaded successfully');
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.error('FeedCard hover sound load failed:', e);
        console.error('Sound URL:', hoverSoundUrl);
      });
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('canplaythrough', () => {});
        audioRef.current.removeEventListener('error', () => {});
        audioRef.current = null;
      }
    };
  }, [enableHoverSound, soundVolume]);

  const playHoverSound = async () => {
    if (!enableHoverSound || !audioRef.current || hasPlayedSoundInCurrentHover) {
      return;
    }

    try {
      console.log('Attempting to play hover sound...');
      audioRef.current.currentTime = 0; // 重設到開頭
      
      // 檢查音效是否已載入
      if (audioRef.current.readyState >= 2) { // HAVE_CURRENT_DATA
        await audioRef.current.play();
        setHasPlayedSoundInCurrentHover(true); // 標記已播放
        console.log('Hover sound played successfully');
      } else {
        console.warn('Audio not ready yet, readyState:', audioRef.current.readyState);
        // 嘗試等待載入完成再播放
        audioRef.current.addEventListener('canplay', async () => {
          try {
            await audioRef.current!.play();
            setHasPlayedSoundInCurrentHover(true); // 標記已播放
            console.log('Hover sound played successfully after loading');
          } catch (err) {
            console.warn('Delayed sound play failed:', err);
          }
        }, { once: true });
      }
    } catch (error) {
      console.warn('FeedCard hover sound play failed:', error);
      console.warn('Sound URL:', hoverSoundUrl);
      console.warn('This might be due to browser autoplay policy. Try interacting with the page first.');
    }
  };

  // 以 CSS 變數傳遞 padding 和 info max-width，樣式中使用 var() 引用
  const rootStyle: FeedCardStyle = {
    ...style,
    height: `${computedHeight}px`,
    '--feed-card-padding': `${Math.max(0, padding)}px`,
    '--feed-card-info-max-width': `${Math.max(1, infoMaxWidth)}px`,
  } as FeedCardStyle;

  // 從 item 推導資料（不覆蓋使用者顯式傳入）
  const finalSrc = src || (item?.heroImage ?? '');
  const finalSecondaryColor = secondaryColor || item?.secondaryColor;
  const derivedInfoData: FeedCardInfoData | undefined = infoData || (item ? {
    id: item.id,
    heading: item.heading,
    date: item.date,
    tags: item.tags,
    category: item.category,
  } : undefined);

  // 與 PixelImage Default demo 一致的預設參數（允許 backgroundProps 覆寫）
  const mergedBgProps: Omit<PixelImageProps, 'src'> = {
    pixelSize: backgroundProps?.pixelSize ?? 80,
    hoverPixelToOne: backgroundProps?.hoverPixelToOne ?? true,
    hoverPixelDuration: backgroundProps?.hoverPixelDuration ?? 500,
    desaturateUntilHover: backgroundProps?.desaturateUntilHover ?? true,
    outline: backgroundProps?.outline ?? true,
    normalEdgeStrength: backgroundProps?.normalEdgeStrength ?? 0.2,
    depthEdgeStrength: backgroundProps?.depthEdgeStrength ?? 0.3,
    normalTolerance: backgroundProps?.normalTolerance ?? 0.2,
    depthTolerance: backgroundProps?.depthTolerance ?? 0.1,
    objectFit: backgroundProps?.objectFit ?? 'cover',
    // 將目標顏色固定傳入，實際進/出時的切換交由 PixelImage 以 CSS 補間處理
    maskColor: backgroundProps?.maskColor ?? (finalSecondaryColor ?? '#1B2350'),
    maskOpacity: backgroundProps?.maskOpacity ?? 0.85,
    maxPixelRatio: backgroundProps?.maxPixelRatio ?? 1.5,
    className: backgroundProps?.className,
    onLoad: backgroundProps?.onLoad,
    onError: backgroundProps?.onError,
  };

  return (
    <div
      ref={ref}
      className={`feed-card size-${size} ${className}`.trim()}
      style={rootStyle}
      onMouseEnter={disableHover ? undefined : () => {
        setIsHovered(true);
        playHoverSound();
      }}
      onMouseLeave={disableHover ? undefined : () => {
        setIsHovered(false);
        setHasPlayedSoundInCurrentHover(false); // 重置音效播放狀態，允許下次 hover 播放
      }}
    >
      <div className="feed-card__bg">
        <PixelImage src={finalSrc} hoverActive={actualIsHovered} {...mergedBgProps} />
      </div>

      <div className="feed-card__overlay">
        <div className="feed-card__content">
          <FeedCardHoverContext.Provider value={actualIsHovered}>
            <FeedCardSizeContext.Provider value={size}>
              {children ?? (
                derivedInfoData ? (
                  <FeedCardInfo
                    data={derivedInfoData}
                    primaryColor={item?.primaryColor}
                    secondaryColor={finalSecondaryColor}
                  />
                ) : null
              )}
            </FeedCardSizeContext.Provider>
          </FeedCardHoverContext.Provider>
        </div>
      </div>
    </div>
  );
});

FeedCard.displayName = 'FeedCard';

export default FeedCard;


