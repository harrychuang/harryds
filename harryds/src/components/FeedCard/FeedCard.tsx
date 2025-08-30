// =============================================================================
// FEED CARD 元件 - 使用 PixelImage 作為背景的卡片
// 尺寸：hero(600)、med(500)、sm(400)、xs(240)；預設 padding 40，內容置左下
// =============================================================================

import React, { CSSProperties, forwardRef } from 'react';
import { PixelImage } from '../PixelImage';
import type { PixelImageProps } from '../PixelImage';
import './FeedCard.scss';

export type FeedCardSize = 'hero' | 'med' | 'sm' | 'xs';

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
  /** 額外類名 */
  className?: string;
  /** 內容節點，顯示於卡片左下角 */
  children?: React.ReactNode;
  /** 內聯樣式（少用） */
  style?: CSSProperties;
}

const SIZE_TO_HEIGHT: Record<FeedCardSize, number> = {
  hero: 600,
  med: 500,
  sm: 400,
  xs: 240,
};

type FeedCardStyle = CSSProperties & { ['--feed-card-padding']?: string };

export const FeedCard = forwardRef<HTMLDivElement, FeedCardProps>(({
  src,
  size = 'hero',
  height,
  padding = 40,
  backgroundProps,
  className = '',
  children,
  style,
}, ref) => {
  const computedHeight = Math.max(1, Math.floor(height ?? SIZE_TO_HEIGHT[size]));

  // 以 CSS 變數傳遞 padding，樣式中使用 var(--feed-card-padding)
  const rootStyle: FeedCardStyle = {
    ...style,
    height: `${computedHeight}px`,
    '--feed-card-padding': `${Math.max(0, padding)}px`,
  } as FeedCardStyle;

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
    maskColor: backgroundProps?.maskColor ?? '#1B2350',
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
    >
      <div className="feed-card__bg">
        <PixelImage src={src} {...mergedBgProps} />
      </div>

      <div className="feed-card__overlay">
        <div className="feed-card__content">
          {children}
        </div>
      </div>
    </div>
  );
});

FeedCard.displayName = 'FeedCard';

export default FeedCard;


