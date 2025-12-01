// =============================================================================
// FEED CARD 元件 - 使用 PixelationImg 作為背景的卡片
// 尺寸：hero(600)、med(500)、sm(400)、xs(240)；預設 padding 40，內容水平置中
// FeedCardInfo 預設 max-width 1600px
// =============================================================================

import React, { CSSProperties, createContext, forwardRef, useState, useRef, useEffect, useCallback } from 'react';
import { PixelationImg } from '../PixelationImg';
import type { PixelationImgProps } from '../PixelationImg';
import FeedCardInfo from './FeedCardInfo';
import type { FeedCardInfoData } from './FeedCardInfo';
import type { FeedItem } from '../../types/feed';
import './FeedCard.scss';
import hoverSoundUrl from '../../../assets/sound/Coin Collect Retro 8-bit Sound Effect.mp3';
import { audioManager, type PlaybackHandle } from '../../utils/audioManager';

export type FeedCardSize = 'hero' | 'med' | 'sm' | 'xs';
export const FeedCardHoverContext = createContext<boolean>(false);
export const FeedCardSizeContext = createContext<FeedCardSize>('hero');


export interface FeedCardProps {
  /** 背景圖來源 URL（交由 PixelationImg 載入） */
  src: string;
  /** 尺寸分類（預設 hero） */
  size?: FeedCardSize;
  /** 覆寫高度（px）。若提供則優先於 size 預設高度 */
  height?: number;
  /** 內距（px）。預設 40 */
  padding?: number;
  /** 傳遞給 PixelationImg 的額外參數（不含 src） */
  backgroundProps?: Partial<Omit<PixelationImgProps, 'src'>>;
  /** JSON 的 secondary color（hover 時套用至 PixelationImg maskColor） */
  secondaryColor?: string;
  /** 若提供，將自動從 item 取用 src/顏色，且在未提供 children 時自動渲染 FeedCardInfo */
  item?: FeedItem;
  /** 直接提供 FeedCardInfo 資料（覆蓋 item 推導） */
  infoData?: FeedCardInfoData;
  /** FeedCardInfo 的最大寬度（px）。預設 1600 */
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
  const hoverSoundHandleRef = useRef<PlaybackHandle | null>(null);
  const computedHeight = Math.max(1, Math.floor(height ?? SIZE_TO_HEIGHT[size]));
  
  // 計算實際的 hover 狀態：forceHovered 優先，否則使用 isHovered
  const actualIsHovered = forceHovered || isHovered;
  // 允許父層以 backgroundProps.hoverActive 覆寫 hover 狀態（例如 Overlay 固定啟用）
  const explicitHoverActive = backgroundProps?.hoverActive;

  // 預載音效
  useEffect(() => {
    if (enableHoverSound) {
      audioManager.preload(hoverSoundUrl).catch(() => {});
    }
  }, [enableHoverSound]);

  const playHoverSound = useCallback(async () => {
    if (!enableHoverSound || hasPlayedSoundInCurrentHover) {
      return;
    }

    try {
      hoverSoundHandleRef.current?.stop();
      hoverSoundHandleRef.current = await audioManager.play(hoverSoundUrl, { 
        volume: Math.max(0, Math.min(1, soundVolume)) 
      });
      setHasPlayedSoundInCurrentHover(true);
    } catch (error) {
      // ignore
    }
  }, [enableHoverSound, hasPlayedSoundInCurrentHover, soundVolume]);

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

  // 與 PixelationImg 一致的預設參數（允許 backgroundProps 覆寫）
  const mergedBgProps: Omit<PixelationImgProps, 'src'> = {
    pixelSize: backgroundProps?.pixelSize ?? 80,
    hoverToOriginal: backgroundProps?.hoverToOriginal ?? true,
    hoverDuration: backgroundProps?.hoverDuration ?? 500,
    desaturateUntilHover: backgroundProps?.desaturateUntilHover ?? true,
    objectFit: backgroundProps?.objectFit ?? 'cover',
    // Hover 時使用資料的 secondaryColor；無資料時退回 theme mask
    maskColor: backgroundProps?.maskColor ?? (finalSecondaryColor ?? 'var(--hds-sys-color-theme-mask)'),
    maskOpacity: backgroundProps?.maskOpacity ?? 0.6,
    maxPixelRatio: backgroundProps?.maxPixelRatio ?? 2,
    className: backgroundProps?.className,
    onLoad: backgroundProps?.onLoad,
    onError: backgroundProps?.onError,
  };
  
  //

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
        <PixelationImg
          src={finalSrc}
          {...mergedBgProps}
          hoverActive={explicitHoverActive !== undefined ? explicitHoverActive : actualIsHovered}
          pixelSize={mergedBgProps.pixelSize}
        />
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
                    hovered={actualIsHovered}
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


