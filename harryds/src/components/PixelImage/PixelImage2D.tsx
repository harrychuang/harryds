// =============================================================================
// PIXEL IMAGE 2D 元件 - 使用 2D Canvas 將圖片像素化（不使用 WebGL）
// 與原 PixelImage 保持相同 API，解決 WebGL context 限制問題
// =============================================================================

import { useEffect, useRef, useState, useCallback, forwardRef } from 'react';
import type { PixelImageProps } from './PixelImage';

const PixelImage2D = forwardRef<HTMLDivElement, PixelImageProps>(({ 
  src,
  pixelSize = 80,
  hoverPixelToOne = false,
  hoverPixelDuration = 500,
  desaturateUntilHover = true,
  outline: _outline = false, // 2D Canvas 實現邊緣檢測較複雜，預設關閉（不使用，保留 API）
  maxPixelRatio = 1.5,
  objectFit = 'cover',
  maskColor,
  maskOpacity = 0.8,
  className = '',
  onLoad,
  onError,
  hoverActive,
}, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  
  // 動畫相關狀態
  const currentPixelSizeRef = useRef<number>(pixelSize);
  const targetPixelSizeRef = useRef<number>(pixelSize);
  const isAnimatingRef = useRef<boolean>(false);
  const animStartRef = useRef<number>(0);
  const isHoveredRef = useRef<boolean>(false);

  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // 計算圖片在容器中的位置和大小
  const calculateImageLayout = useCallback((imgW: number, imgH: number, viewW: number, viewH: number) => {
    const imageAspect = imgW / imgH;
    const viewAspect = viewW / viewH;

    let targetW = viewW;
    let targetH = viewH;
    let offsetX = 0;
    let offsetY = 0;

    if (objectFit === 'fill') {
      targetW = viewW;
      targetH = viewH;
    } else if (objectFit === 'contain') {
      if (imageAspect > viewAspect) {
        targetW = viewW;
        targetH = viewW / imageAspect;
        offsetY = (viewH - targetH) / 2;
      } else {
        targetH = viewH;
        targetW = viewH * imageAspect;
        offsetX = (viewW - targetW) / 2;
      }
    } else {
      // cover
      if (imageAspect > viewAspect) {
        targetH = viewH;
        targetW = viewH * imageAspect;
        offsetX = (viewW - targetW) / 2;
      } else {
        targetW = viewW;
        targetH = viewW / imageAspect;
        offsetY = (viewH - targetH) / 2;
      }
    }

    return { targetW, targetH, offsetX, offsetY };
  }, [objectFit]);

  // 初始化/取得離屏畫布
  const getOffscreen = useCallback(() => {
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
      offscreenCtxRef.current = offscreenCanvasRef.current.getContext('2d');
    }
    return {
      canvas: offscreenCanvasRef.current!,
      ctx: offscreenCtxRef.current!,
    };
  }, []);

  // 渲染圖片
  const renderImage = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    
    if (!canvas || !img || !imageLoaded || containerSize.width <= 0 || containerSize.height <= 0) {
      return;
    }
    
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    
    const { width, height } = containerSize;
    const dpr = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
    
    // 設置 canvas 尺寸
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // 重置變換並設置縮放
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;
    
    // 清除 canvas
    ctx.clearRect(0, 0, width, height);

    // 計算圖片佈局
    const layout = calculateImageLayout(img.width, img.height, width, height);
    
    if (layout.targetW <= 0 || layout.targetH <= 0) return;
    
    // 創建臨時 canvas 來處理圖片
    // 使用縮小再放大的高效像素化策略
    const { canvas: offCanvas, ctx: offCtx } = getOffscreen();
    const blocksX = Math.max(1, Math.floor(layout.targetW / Math.max(1, currentPixelSizeRef.current)));
    const blocksY = Math.max(1, Math.floor(layout.targetH / Math.max(1, currentPixelSizeRef.current)));

    offCanvas.width = blocksX;
    offCanvas.height = blocksY;
    offCtx.imageSmoothingEnabled = false;
    offCtx.clearRect(0, 0, blocksX, blocksY);

    // 將原圖縮小繪製到離屏（取樣）
    offCtx.drawImage(img, 0, 0, blocksX, blocksY);

    // 如需去彩，使用 canvas filter（較快）
    const shouldDesaturate = desaturateUntilHover && (!hoverPixelToOne || !isHoveredRef.current);
    ctx.filter = shouldDesaturate ? 'saturate(0%)' : 'none';

    // 將離屏結果放大回主畫布
    ctx.drawImage(
      offCanvas,
      0,
      0,
      blocksX,
      blocksY,
      Math.round(layout.offsetX),
      Math.round(layout.offsetY),
      Math.round(layout.targetW),
      Math.round(layout.targetH)
    );
    ctx.filter = 'none';
  }, [
    imageLoaded, 
    containerSize.width, 
    containerSize.height, 
    maxPixelRatio, 
    calculateImageLayout, 
    desaturateUntilHover, 
    hoverPixelToOne,
    getOffscreen
  ]);

  // 動畫循環
  const animationLoop = useCallback(() => {
    if (!isAnimatingRef.current) {
      rafRef.current = null;
      return;
    }

    const now = performance.now();
    const elapsed = now - animStartRef.current;
    const duration = Math.max(1, hoverPixelDuration);
    const progress = Math.min(1, elapsed / duration);
    
    const eased = 1 - Math.pow(1 - progress, 3);
    const from = currentPixelSizeRef.current;
    const to = targetPixelSizeRef.current;
    const newPixelSize = from + (to - from) * eased;
    currentPixelSizeRef.current = newPixelSize;

    renderImage();

    if (progress >= 1) {
      isAnimatingRef.current = false;
      currentPixelSizeRef.current = targetPixelSizeRef.current;
      rafRef.current = null;
    } else {
      rafRef.current = requestAnimationFrame(animationLoop);
    }
  }, [hoverPixelDuration, renderImage]);

  // 開始動畫
  const startAnimation = useCallback((toPixel: number) => {
    if (!hoverPixelToOne) return;

    targetPixelSizeRef.current = toPixel;
    animStartRef.current = performance.now();
    isAnimatingRef.current = true;

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(animationLoop);
    }
  }, [hoverPixelToOne, animationLoop]);

  // 載入圖片
  useEffect(() => {
    if (!src) return;
    
    let mounted = true;
    setImageLoaded(false);
    imageRef.current = null;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      if (mounted) {
        imageRef.current = img;
        setImageLoaded(true);
        if (onLoad) onLoad();
      }
    };
    
    img.onerror = (error) => {
      if (mounted && onError) {
        onError(error);
      }
    };
    
    img.src = src;

    return () => {
      mounted = false;
    };
  }, [src, onLoad, onError]);

  // 初始化容器尺寸
  useEffect(() => {
    const el = (ref as React.RefObject<HTMLDivElement>)?.current || containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      const newWidth = Math.max(1, Math.round(rect.width));
      const newHeight = Math.max(1, Math.round(rect.height));
      
      setContainerSize(prev => {
        if (prev.width !== newWidth || prev.height !== newHeight) {
          return { width: newWidth, height: newHeight };
        }
        return prev;
      });
    };

    // 初始化尺寸
    const timer = setTimeout(updateSize, 0);

    // ResizeObserver
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    resizeObserverRef.current = ro;
    
    return () => {
      clearTimeout(timer);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [ref]);

  // 重新渲染當圖片和尺寸準備好時
  useEffect(() => {
    if (imageLoaded && containerSize.width > 0 && containerSize.height > 0) {
      renderImage();
    }
  }, [imageLoaded, containerSize.width, containerSize.height, renderImage]);

  // 當 pixelSize 改變時更新
  useEffect(() => {
    if (!isAnimatingRef.current) {
      currentPixelSizeRef.current = pixelSize;
      targetPixelSizeRef.current = pixelSize;
    }
  }, [pixelSize]);

  // 處理 hoverActive 控制
  useEffect(() => {
    if (!hoverPixelToOne) return;
    
    const isActive = !!hoverActive;
    isHoveredRef.current = isActive;
    
    if (maskRef.current) {
      const baseOpacity = String(Math.max(0, Math.min(1, maskOpacity)));
      if (isActive) {
        maskRef.current.style.backgroundColor = (maskColor as string) || 'var(--hds-sys-color-theme-mask)';
        maskRef.current.style.opacity = desaturateUntilHover ? baseOpacity : '0';
      } else {
        maskRef.current.style.backgroundColor = 'var(--hds-sys-color-theme-mask)';
        maskRef.current.style.opacity = desaturateUntilHover ? baseOpacity : '0';
      }
    }
    
    if (isActive) {
      startAnimation(1);
    } else {
      startAnimation(pixelSize);
    }
  }, [hoverActive, hoverPixelToOne, pixelSize, startAnimation, desaturateUntilHover, maskColor, maskOpacity]);

  // 處理 hover 事件
  const handlePointerEnter = () => {
    if (hoverPixelToOne && !hoverActive) {
      isHoveredRef.current = true;
      startAnimation(1);
      if (maskRef.current) {
        const baseOpacity = String(Math.max(0, Math.min(1, maskOpacity)));
        if (desaturateUntilHover) {
          maskRef.current.style.backgroundColor = (maskColor as string) || 'var(--hds-sys-color-theme-mask)';
          maskRef.current.style.opacity = baseOpacity;
        } else {
          maskRef.current.style.opacity = baseOpacity;
        }
      }
    }
  };

  const handlePointerLeave = () => {
    if (hoverPixelToOne && !hoverActive) {
      isHoveredRef.current = false;
      startAnimation(pixelSize);
      if (maskRef.current) {
        if (desaturateUntilHover) {
          maskRef.current.style.backgroundColor = 'var(--hds-sys-color-theme-mask)';
          maskRef.current.style.opacity = String(Math.max(0, Math.min(1, maskOpacity)));
        } else {
          maskRef.current.style.opacity = '0';
        }
      }
    }
  };

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        if (ref) {
          if (typeof ref === 'function') {
            ref(node);
          } else {
            ref.current = node;
          }
        }
      }}
      className={`pixel-image pixel-image-2d ${className}`}
      style={{ width: '100%', height: '100%', position: 'relative', display: 'block' }}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      <div
        ref={maskRef}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: desaturateUntilHover ? 'var(--hds-sys-color-theme-mask)' : ((maskColor as string) || 'var(--hds-sys-color-theme-mask)'),
          opacity: desaturateUntilHover ? Math.max(0, Math.min(1, maskOpacity)) : 0,
          pointerEvents: 'none',
          transition: `opacity ${Math.max(0, Math.floor(hoverPixelDuration || 0))}ms cubic-bezier(0.215, 0.61, 0.355, 1)`,
        }}
      />
    </div>
  );
});

PixelImage2D.displayName = 'PixelImage2D';

export { PixelImage2D };
export default PixelImage2D;