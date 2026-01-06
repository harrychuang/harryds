// =============================================================================
// FEED CARD 元件 - 使用 PixelationImg 作為背景的卡片
// 尺寸：hero(600)、med(500)、sm(400)、xs(240)；預設 padding 40，內容水平置中
// FeedCardInfo 預設 max-width 1600px
// =============================================================================

import React, { CSSProperties, createContext, forwardRef, useState, useRef, useEffect, useCallback, TouchEvent as ReactTouchEvent } from 'react';
import { PixelationImg } from '../PixelationImg';
import type { PixelationImgProps } from '../PixelationImg';
import FeedCardInfo from './FeedCardInfo';
import type { FeedCardInfoData } from './FeedCardInfo';
import type { FeedItem } from '../../types/feed';
import './FeedCard.scss';
import hoverSoundUrl from '../../../assets/sound/Coin Collect Retro 8-bit Sound Effect.mp3';
import { audioManager, type PlaybackHandle } from '../../utils/audioManager';

// 檢測設備是否支援 hover（非觸控設備）
const getHasHoverCapability = (): boolean => {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(hover: hover)').matches;
};

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
  /** 主色（hover 時的文字色、Private 標籤色等） */
  primaryColor?: string;
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
  /** 是否為私密專案（顯示右上角 Private 標籤） */
  isPrivate?: boolean;
  /** Private 標籤文字（預設 "Private"） */
  privateLabel?: string;
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

// 8-bit 風格 Locked Icon（內聯 SVG）
const LockedIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className}
    width="12" 
    height="14" 
    viewBox="0 0 12 14" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 鎖頭上方的弧形部分（像素風格） */}
    <rect x="2" y="0" width="2" height="2" />
    <rect x="8" y="0" width="2" height="2" />
    <rect x="0" y="2" width="2" height="4" />
    <rect x="10" y="2" width="2" height="4" />
    {/* 鎖身 */}
    <rect x="0" y="6" width="12" height="8" />
    {/* 鑰匙孔 */}
    <rect x="5" y="8" width="2" height="2" fill="var(--hds-sys-color-bg-primary, #1a1a1a)" />
    <rect x="5" y="10" width="2" height="2" fill="var(--hds-sys-color-bg-primary, #1a1a1a)" />
  </svg>
);

export const FeedCard = forwardRef<HTMLDivElement, FeedCardProps>(({
  src,
  size = 'hero',
  height,
  padding = 40,
  backgroundProps,
  primaryColor,
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
  isPrivate,
  privateLabel = 'Private',
}, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hasPlayedSoundInCurrentHover, setHasPlayedSoundInCurrentHover] = useState(false);
  const hoverSoundHandleRef = useRef<PlaybackHandle | null>(null);
  const computedHeight = Math.max(1, Math.floor(height ?? SIZE_TO_HEIGHT[size]));
  
  // 檢測設備是否支援 hover（觸控設備上禁用 hover 事件）
  const [hasHover, setHasHover] = useState(getHasHoverCapability);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover)');
    const handleChange = (e: MediaQueryListEvent) => setHasHover(e.matches);
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);
  
  // 實際是否啟用 hover：需要設備支援 hover 且未被禁用
  const isHoverEnabled = hasHover && !disableHover;
  
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
  const finalPrimaryColor = primaryColor || item?.primaryColor;
  const finalSecondaryColor = secondaryColor || item?.secondaryColor;
  const derivedInfoData: FeedCardInfoData | undefined = infoData || (item ? {
    id: item.id,
    heading: item.heading,
    date: item.date,
    tags: item.tags,
    category: item.category,
  } : undefined);
  
  // 判斷是否為 private（優先使用 prop，其次使用 item）
  const showPrivate = isPrivate ?? item?.isPrivate ?? false;

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

  // Touch 事件處理（觸控設備模擬 hover 效果）
  // 使用 ref 追蹤元素，用於檢測手指是否移出元素範圍
  const cardRef = useRef<HTMLDivElement | null>(null);
  const isTouchActiveRef = useRef(false);

  // 清除 hover 狀態的函數
  const clearHoverState = useCallback(() => {
    if (!isTouchActiveRef.current) return;
    isTouchActiveRef.current = false;
    setIsHovered(false);
    setHasPlayedSoundInCurrentHover(false);
  }, []);

  // Touch 結束處理（document 級別）
  useEffect(() => {
    const handleDocumentTouchEnd = () => {
      clearHoverState();
    };

    // 只在觸控設備上添加 document 監聽器
    if (!hasHover && !disableHover) {
      document.addEventListener('touchend', handleDocumentTouchEnd, { passive: true });
      document.addEventListener('touchcancel', handleDocumentTouchEnd, { passive: true });
    }

    return () => {
      document.removeEventListener('touchend', handleDocumentTouchEnd);
      document.removeEventListener('touchcancel', handleDocumentTouchEnd);
    };
  }, [hasHover, disableHover, clearHoverState]);

  const handleTouchStart = useCallback((e: ReactTouchEvent<HTMLDivElement>) => {
    if (disableHover) return;
    isTouchActiveRef.current = true;
    setIsHovered(true);
    playHoverSound();
  }, [disableHover, playHoverSound]);

  // 檢測手指是否移出元素範圍
  const handleTouchMove = useCallback((e: ReactTouchEvent<HTMLDivElement>) => {
    if (disableHover || !isTouchActiveRef.current || !cardRef.current) return;
    
    const touch = e.touches[0];
    if (!touch) {
      clearHoverState();
      return;
    }

    const rect = cardRef.current.getBoundingClientRect();
    const isInsideElement = 
      touch.clientX >= rect.left &&
      touch.clientX <= rect.right &&
      touch.clientY >= rect.top &&
      touch.clientY <= rect.bottom;

    if (!isInsideElement) {
      clearHoverState();
    }
  }, [disableHover, clearHoverState]);

  const handleTouchEnd = useCallback(() => {
    // 實際清除由 document 級別監聽器處理
    // 這裡保留作為備用
    clearHoverState();
  }, [clearHoverState]);

  // 合併外部 ref 和內部 cardRef
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    cardRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  }, [ref]);

  return (
    <div
      ref={setRefs}
      className={`feed-card size-${size} ${className}`.trim()}
      style={rootStyle}
      // 使用 data-hovered 讓 CSS 也能感知 JS 控制的 hover 狀態
      data-hovered={actualIsHovered ? 'true' : undefined}
      // 桌面設備：使用 mouse 事件
      onMouseEnter={isHoverEnabled ? () => {
        setIsHovered(true);
        playHoverSound();
      } : undefined}
      onMouseLeave={isHoverEnabled ? () => {
        setIsHovered(false);
        setHasPlayedSoundInCurrentHover(false);
      } : undefined}
      // 觸控設備：使用 touch 事件模擬 hover
      onTouchStart={!hasHover && !disableHover ? handleTouchStart : undefined}
      onTouchMove={!hasHover && !disableHover ? handleTouchMove : undefined}
      onTouchEnd={!hasHover && !disableHover ? handleTouchEnd : undefined}
      onTouchCancel={!hasHover && !disableHover ? handleTouchEnd : undefined}
    >
      <div className="feed-card__bg">
        <PixelationImg
            src={finalSrc} 
            {...mergedBgProps}
            hoverActive={explicitHoverActive !== undefined ? explicitHoverActive : actualIsHovered} 
            pixelSize={mergedBgProps.pixelSize}
            hoverPixelSize={0}
          />
      </div>

      {/* Private 標籤（右上角） */}
      {showPrivate && (
        <div 
          className="feed-card__private-badge"
          style={{ 
            color: actualIsHovered 
              ? (finalPrimaryColor ?? 'var(--hds-sys-color-theme-surface)') 
              : 'var(--hds-sys-color-theme-surface)',
            transition: 'color 300ms ease'
          }}
        >
          <LockedIcon className="feed-card__private-icon" />
          <span className="feed-card__private-text">{privateLabel}</span>
        </div>
      )}

      <div className="feed-card__overlay">
        <div className="feed-card__content">
          <FeedCardHoverContext.Provider value={actualIsHovered}>
            <FeedCardSizeContext.Provider value={size}>
              {children ?? (
                derivedInfoData ? (
                  <FeedCardInfo
                    data={derivedInfoData}
                    primaryColor={finalPrimaryColor}
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


