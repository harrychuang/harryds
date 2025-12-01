// =============================================================================
// PixelationImg 元件 - 優化的像素化圖片元件
// 使用共享渲染管理器，支援多實例同時存在並保持良好效能
// =============================================================================

import {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useId,
  useState,
} from 'react';
import PixelationManager from './pixelationManager';
import type { PixelationInstance } from './pixelationManager';

export type PixelationImgObjectFit = 'cover' | 'contain' | 'fill';

export interface PixelationImgProps {
  /** 圖片來源 URL */
  src: string;
  /** 替代文字 */
  alt?: string;
  /** 像素大小（數值越大越粗，預設 40） */
  pixelSize?: number;
  /** 滑鼠懸停時是否以補間動畫將像素大小緩動至 1，再移開恢復 */
  hoverToOriginal?: boolean;
  /** 懸停像素補間動畫時長（毫秒，預設 400） */
  hoverDuration?: number;
  /** 是否在非 hover 狀態將彩度降至最低（灰階），hover 時恢復色彩 */
  desaturateUntilHover?: boolean;
  /** DPR 上限，避免行動裝置過高像素比造成負擔（預設 2） */
  maxPixelRatio?: number;
  /** 尺寸配置：圖片如何填滿容器（預設 cover） */
  objectFit?: PixelationImgObjectFit;
  /** 遮罩顏色（覆蓋在 canvas 之上） */
  maskColor?: string;
  /** 遮罩不透明度（0~1，預設 0.6） */
  maskOpacity?: number;
  /** 額外 CSS 類名 */
  className?: string;
  /** 行內樣式 */
  style?: React.CSSProperties;
  /** 載入成功回呼 */
  onLoad?: () => void;
  /** 載入失敗回呼 */
  onError?: (error: unknown) => void;
  /** 由父元件控制的 hover 狀態 */
  hoverActive?: boolean;
  /** 是否禁用（不渲染像素化效果，顯示原圖） */
  disabled?: boolean;
}

const PixelationImg = forwardRef<HTMLDivElement, PixelationImgProps>(
  (
    {
      src,
      alt = '',
      pixelSize = 40,
      hoverToOriginal = false,
      hoverDuration = 400,
      desaturateUntilHover = false,
      maxPixelRatio = 2,
      objectFit = 'cover',
      maskColor,
      maskOpacity = 0.6,
      className = '',
      style,
      onLoad,
      onError,
      hoverActive,
      disabled = false,
    },
    ref
  ) => {
    // 生成唯一 ID
    const reactId = useId();
    const instanceId = useRef<string>(`pixelation-${reactId}-${Math.random().toString(36).slice(2)}`);

    // DOM refs
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const maskRef = useRef<HTMLDivElement | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);

    // 狀態
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const isHoveredRef = useRef(false);

    // 取得管理器實例
    const manager = PixelationManager.getInstance();

    // 計算有效像素大小
    const computeEffectivePixel = useCallback(
      (base: number, width: number, height: number): number => {
        const aw = Math.max(1, Math.floor(width));
        const ah = Math.max(1, Math.floor(height));
        const maxByW = Math.max(1, Math.floor(aw / 2));
        const maxByH = Math.max(1, Math.floor(ah / 2));
        return Math.max(1, Math.min(Math.floor(base), maxByW, maxByH));
      },
      []
    );

    // 初始化和清理
    useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      // 建立 IntersectionObserver 監控可見性
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          const visible = entry.isIntersecting && entry.intersectionRatio > 0;
          manager.setVisible(instanceId.current, visible);
        },
        { threshold: [0, 0.01] }
      );
      observer.observe(container);

      // 建立 ResizeObserver 監控尺寸變化
      const resizeObserver = new ResizeObserver(() => {
        if (imageRef.current) {
          manager.renderInstance(instanceId.current);
        }
      });
      resizeObserver.observe(container);

      return () => {
        observer.disconnect();
        resizeObserver.disconnect();
        manager.unregister(instanceId.current);
      };
    }, [manager]);

    // 載入圖片
    useEffect(() => {
      if (!src) return;

      let mounted = true;
      setImageLoaded(false);

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        if (!mounted) return;
        imageRef.current = img;
        setImageLoaded(true);
        onLoad?.();

        // 註冊或更新實例
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (container && canvas) {
          const rect = container.getBoundingClientRect();
          const effectivePixel = computeEffectivePixel(
            pixelSize,
            rect.width,
            rect.height
          );

          const instance: PixelationInstance = {
            id: instanceId.current,
            canvas,
            image: img,
            container,
            currentPixelSize: effectivePixel,
            targetPixelSize: effectivePixel,
            basePixelSize: pixelSize,
            isAnimating: false,
            animationStartTime: 0,
            animationFrom: effectivePixel,
            animationTo: effectivePixel,
            animationDuration: hoverDuration,
            isVisible: true,
            isHovered: isHoveredRef.current,
            objectFit,
            maxPixelRatio,
            desaturate: desaturateUntilHover,
          };

          manager.register(instance);
          manager.renderInstance(instanceId.current);
        }
      };

      img.onerror = (error) => {
        if (!mounted) return;
        onError?.(error);
      };

      img.src = src;

      return () => {
        mounted = false;
      };
    }, [
      src,
      pixelSize,
      hoverDuration,
      objectFit,
      maxPixelRatio,
      desaturateUntilHover,
      computeEffectivePixel,
      manager,
      onLoad,
      onError,
    ]);

    // 更新實例屬性（當 props 改變時）
    useEffect(() => {
      if (!imageLoaded) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const effectivePixel = computeEffectivePixel(
        pixelSize,
        rect.width,
        rect.height
      );

      manager.updateInstance(instanceId.current, {
        basePixelSize: pixelSize,
        objectFit,
        maxPixelRatio,
        desaturate: desaturateUntilHover,
        animationDuration: hoverDuration,
      });

      // 如果不在動畫中，更新當前像素大小
      const instance = manager.getInstance(instanceId.current);
      if (instance && !instance.isAnimating && !isHoveredRef.current) {
        manager.updateInstance(instanceId.current, {
          currentPixelSize: effectivePixel,
          targetPixelSize: effectivePixel,
        });
        manager.renderInstance(instanceId.current);
      }
    }, [
      imageLoaded,
      pixelSize,
      objectFit,
      maxPixelRatio,
      desaturateUntilHover,
      hoverDuration,
      computeEffectivePixel,
      manager,
    ]);

    // 處理 hover 狀態（受控模式）
    useEffect(() => {
      if (hoverActive === undefined) return;
      if (!imageLoaded || !hoverToOriginal) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      isHoveredRef.current = hoverActive;
      setIsHovered(hoverActive);

      manager.updateInstance(instanceId.current, {
        isHovered: hoverActive,
      });

      if (hoverActive) {
        manager.startAnimation(instanceId.current, 1, hoverDuration);
      } else {
        const effectivePixel = computeEffectivePixel(
          pixelSize,
          rect.width,
          rect.height
        );
        manager.startAnimation(instanceId.current, effectivePixel, hoverDuration);
      }
    }, [
      hoverActive,
      hoverToOriginal,
      imageLoaded,
      pixelSize,
      hoverDuration,
      computeEffectivePixel,
      manager,
    ]);

    // 處理滑鼠事件
    const handlePointerEnter = useCallback(() => {
      if (hoverActive !== undefined || !hoverToOriginal || !imageLoaded) return;

      isHoveredRef.current = true;
      setIsHovered(true);

      manager.updateInstance(instanceId.current, {
        isHovered: true,
      });
      manager.startAnimation(instanceId.current, 1, hoverDuration);
    }, [hoverActive, hoverToOriginal, imageLoaded, hoverDuration, manager]);

    const handlePointerLeave = useCallback(() => {
      if (hoverActive !== undefined || !hoverToOriginal || !imageLoaded) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const effectivePixel = computeEffectivePixel(
        pixelSize,
        rect.width,
        rect.height
      );

      isHoveredRef.current = false;
      setIsHovered(false);

      manager.updateInstance(instanceId.current, {
        isHovered: false,
      });
      manager.startAnimation(instanceId.current, effectivePixel, hoverDuration);
    }, [
      hoverActive,
      hoverToOriginal,
      imageLoaded,
      pixelSize,
      hoverDuration,
      computeEffectivePixel,
      manager,
    ]);

    // 計算遮罩樣式
    const shouldShowMask = desaturateUntilHover || maskColor;
    const currentMaskOpacity = desaturateUntilHover
      ? isHovered
        ? 0
        : maskOpacity
      : maskColor
      ? maskOpacity
      : 0;

    // 如果禁用，直接顯示原圖
    if (disabled) {
      return (
        <div
          ref={(node) => {
            containerRef.current = node;
            if (ref) {
              if (typeof ref === 'function') ref(node);
              else ref.current = node;
            }
          }}
          className={`pixelation-img pixelation-img--disabled ${className}`}
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            display: 'block',
            overflow: 'hidden',
            ...style,
          }}
        >
          <img
            src={src}
            alt={alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit,
              display: 'block',
            }}
          />
        </div>
      );
    }

    return (
      <div
        ref={(node) => {
          containerRef.current = node;
          if (ref) {
            if (typeof ref === 'function') ref(node);
            else ref.current = node;
          }
        }}
        className={`pixelation-img ${className}`}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'block',
          overflow: 'hidden',
          ...style,
        }}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            // 使用 GPU 加速
            transform: 'translateZ(0)',
            willChange: 'contents',
          }}
        />
        {shouldShowMask && (
          <div
            ref={maskRef}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor:
                maskColor || 'var(--hds-sys-color-theme-mask, rgba(255,255,255,0.8))',
              opacity: currentMaskOpacity,
              pointerEvents: 'none',
              transition: `opacity ${hoverDuration}ms cubic-bezier(0.215, 0.61, 0.355, 1), background-color ${hoverDuration}ms cubic-bezier(0.215, 0.61, 0.355, 1)`,
            }}
          />
        )}
      </div>
    );
  }
);

PixelationImg.displayName = 'PixelationImg';

export { PixelationImg };
export default PixelationImg;

