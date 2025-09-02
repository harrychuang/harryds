// =============================================================================
// PIXEL IMAGE 2D 元件 - 使用 2D Canvas 將圖片像素化（不使用 WebGL）
// 與原 PixelImage 保持相同 API，解決 WebGL context 限制問題
// =============================================================================

import { useEffect, useRef, useState, useMemo, useCallback, forwardRef } from 'react';
import type { PixelImageProps } from './PixelImage';

const PixelImage2D = forwardRef<HTMLDivElement, PixelImageProps>(({ 
  src,
  pixelSize = 80,
  hoverPixelToOne = false,
  hoverPixelDuration = 500,
  desaturateUntilHover = true,
  outline = false, // 2D Canvas 實現邊緣檢測較複雜，預設關閉
  normalEdgeStrength = 0.2,
  depthEdgeStrength = 0.3,
  normalTolerance = 0.2,
  depthTolerance = 0.1,
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
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const isVisibleRef = useRef<boolean>(true);
  
  // 動畫相關狀態
  const currentPixelSizeRef = useRef<number>(pixelSize);
  const targetPixelSizeRef = useRef<number>(pixelSize);
  const isAnimatingRef = useRef<boolean>(false);
  const animStartRef = useRef<number>(0);
  const animDurationRef = useRef<number>(Math.max(0, hoverPixelDuration));
  const isHoveredRef = useRef<boolean>(false);

  // 遮罩動畫狀態
  const maskFromRef = useRef<number>(0);
  const maskToRef = useRef<number>(0);
  const lastAppliedMaskOpacityRef = useRef<number>(0);

  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 300, height: 200 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [cssVarVersion, setCssVarVersion] = useState(0);

  // 監聽 theme 切換
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'theme') {
          setCssVarVersion((v) => v + 1);
          if (maskRef.current) {
            maskRef.current.style.backgroundColor = 'var(--hds-sys-color-theme-mask)';
          }
        }
      }
    });
    observer.observe(root, { attributes: true, attributeFilter: ['theme'] });
    if (body) observer.observe(body, { attributes: true, attributeFilter: ['theme'] });
    return () => observer.disconnect();
  }, []);

  // 初始化 Canvas
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;
    
    // 設置高 DPR 以提升圖片品質
    const dpr = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
    const { width, height } = containerSize;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false; // 保持像素風格
    
    ctxRef.current = ctx;
    return ctx;
  }, [containerSize, maxPixelRatio]);

  // 載入圖片
  const loadImage = useCallback(async (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        imageRef.current = img;
        setImageLoaded(true);
        if (onLoad) onLoad();
        resolve(img);
      };
      
      img.onerror = (error) => {
        if (onError) onError(error);
        reject(error);
      };
      
      img.src = url;
    });
  }, [onLoad, onError]);

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

  // 將 RGB 轉換為灰階
  const desaturatePixel = useCallback((r: number, g: number, b: number, a: number): [number, number, number, number] => {
    // 使用標準灰階轉換公式
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    return [gray, gray, gray, a];
  }, []);

  // 像素化處理
  const pixelateImageData = useCallback((
    ctx: CanvasRenderingContext2D,
    imageData: ImageData,
    pixelSize: number,
    shouldDesaturate: boolean
  ): ImageData => {
    const { width, height, data } = imageData;
    const newData = new Uint8ClampedArray(data);

    // 確保 pixelSize 至少為 1
    const size = Math.max(1, Math.floor(pixelSize));

    for (let y = 0; y < height; y += size) {
      for (let x = 0; x < width; x += size) {
        // 計算這個像素塊的平均顏色
        let totalR = 0, totalG = 0, totalB = 0, totalA = 0;
        let count = 0;

        for (let dy = 0; dy < size && y + dy < height; dy++) {
          for (let dx = 0; dx < size && x + dx < width; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            totalR += data[idx];
            totalG += data[idx + 1];
            totalB += data[idx + 2];
            totalA += data[idx + 3];
            count++;
          }
        }

        if (count > 0) {
          let avgR = Math.round(totalR / count);
          let avgG = Math.round(totalG / count);
          let avgB = Math.round(totalB / count);
          const avgA = Math.round(totalA / count);

          // 如果需要去彩色
          if (shouldDesaturate) {
            [avgR, avgG, avgB] = desaturatePixel(avgR, avgG, avgB, avgA).slice(0, 3) as [number, number, number];
          }

          // 將平均顏色應用到整個像素塊
          for (let dy = 0; dy < size && y + dy < height; dy++) {
            for (let dx = 0; dx < size && x + dx < width; dx++) {
              const idx = ((y + dy) * width + (x + dx)) * 4;
              newData[idx] = avgR;
              newData[idx + 1] = avgG;
              newData[idx + 2] = avgB;
              newData[idx + 3] = avgA;
            }
          }
        }
      }
    }

    return new ImageData(newData, width, height);
  }, [desaturatePixel]);

  // 渲染圖片
  const renderImage = useCallback(() => {
    const ctx = ctxRef.current || initializeCanvas();
    const img = imageRef.current;
    
    if (!ctx || !img || !imageLoaded) return;

    const { width, height } = containerSize;
    
    // 清除 canvas
    ctx.clearRect(0, 0, width, height);

    // 計算圖片佈局
    const layout = calculateImageLayout(img.width, img.height, width, height);
    
    // 創建臨時 canvas 來處理圖片
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCanvas.width = Math.round(layout.targetW);
    tempCanvas.height = Math.round(layout.targetH);
    tempCtx.imageSmoothingEnabled = false;

    // 繪製圖片到臨時 canvas
    tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

    // 獲取圖片數據
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    
    // 決定是否要去彩色
    const shouldDesaturate = desaturateUntilHover && (!hoverPixelToOne || !isHoveredRef.current);
    
    // 應用像素化效果
    const processedData = pixelateImageData(ctx, imageData, currentPixelSizeRef.current, shouldDesaturate);
    
    // 創建新的 canvas 來放置處理後的數據
    const processedCanvas = document.createElement('canvas');
    const processedCtx = processedCanvas.getContext('2d');
    if (!processedCtx) return;
    
    processedCanvas.width = tempCanvas.width;
    processedCanvas.height = tempCanvas.height;
    processedCtx.putImageData(processedData, 0, 0);

    // 繪製到主 canvas
    ctx.drawImage(
      processedCanvas,
      Math.round(layout.offsetX),
      Math.round(layout.offsetY),
      Math.round(layout.targetW),
      Math.round(layout.targetH)
    );

  }, [initializeCanvas, imageLoaded, containerSize, calculateImageLayout, pixelateImageData, desaturateUntilHover, hoverPixelToOne]);

  // 動畫循環
  const animationLoop = useCallback(() => {
    if (!isAnimatingRef.current) {
      rafRef.current = null;
      return;
    }

    const now = performance.now();
    const elapsed = now - animStartRef.current;
    const progress = Math.min(1, elapsed / Math.max(1, animDurationRef.current));
    
    // easing: easeOutCubic
    const eased = 1 - Math.pow(1 - progress, 3);
    
    // 更新當前像素大小
    const from = currentPixelSizeRef.current;
    const to = targetPixelSizeRef.current;
    const newPixelSize = from + (to - from) * eased;
    currentPixelSizeRef.current = newPixelSize;

    // 更新遮罩不透明度
    const maskNode = maskRef.current;
    if (maskNode) {
      const maskValue = Math.max(0, Math.min(1, maskFromRef.current + (maskToRef.current - maskFromRef.current) * eased));
      if (Math.abs(maskValue - lastAppliedMaskOpacityRef.current) > 0.005) {
        maskNode.style.opacity = String(maskValue);
        lastAppliedMaskOpacityRef.current = maskValue;
      }
    }

    // 重新渲染
    renderImage();

    if (progress >= 1) {
      isAnimatingRef.current = false;
      currentPixelSizeRef.current = targetPixelSizeRef.current;
    }

    if (isAnimatingRef.current) {
      rafRef.current = requestAnimationFrame(animationLoop);
    } else {
      rafRef.current = null;
    }
  }, [renderImage]);

  // 開始動畫
  const startAnimation = useCallback((toPixel: number, toMaskOpacity: number) => {
    if (!hoverPixelToOne) return;

    targetPixelSizeRef.current = toPixel;
    maskFromRef.current = lastAppliedMaskOpacityRef.current;
    maskToRef.current = Math.max(0, Math.min(1, toMaskOpacity));
    animStartRef.current = performance.now();
    isAnimatingRef.current = true;

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(animationLoop);
    }
  }, [hoverPixelToOne, animationLoop]);

  // 處理容器尺寸變化
  const handleResize = useCallback((width: number, height: number) => {
    setContainerSize({ width, height });
    if (ctxRef.current) {
      ctxRef.current = null; // 強制重新初始化
    }
  }, []);

  // 初始化與清理
  useEffect(() => {
    const el = (ref as React.RefObject<HTMLDivElement>)?.current || containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const initialW = Math.max(1, Math.round(rect.width));
    const initialH = Math.max(1, Math.round(rect.height));
    setContainerSize({ width: initialW, height: initialH });

    // ResizeObserver
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const box = entry.contentRect;
      handleResize(Math.max(1, Math.round(box.width)), Math.max(1, Math.round(box.height)));
    });
    ro.observe(el);
    resizeObserverRef.current = ro;

    // IntersectionObserver
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      const visible = entry.isIntersecting && entry.intersectionRatio > 0;
      isVisibleRef.current = visible;
      
      if (visible && imageLoaded && rafRef.current === null) {
        renderImage();
      }
    }, { threshold: [0, 0.01] });
    io.observe(el);

    // 頁面可見性
    const onVis = () => {
      if (!document.hidden && isVisibleRef.current && imageLoaded && rafRef.current === null) {
        renderImage();
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      io.disconnect();
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [ref, handleResize, imageLoaded, renderImage]);

  // 載入圖片
  useEffect(() => {
    if (!src) return;
    
    let mounted = true;
    setImageLoaded(false);
    
    loadImage(src).catch(() => {
      if (mounted && isVisibleRef.current) {
        // 即使載入失敗也要清除 canvas
        const ctx = ctxRef.current || initializeCanvas();
        if (ctx) {
          ctx.clearRect(0, 0, containerSize.width, containerSize.height);
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, [src, loadImage, initializeCanvas, containerSize.width, containerSize.height]);

  // 當圖片載入完成或容器尺寸變化時重新渲染
  useEffect(() => {
    if (imageLoaded && isVisibleRef.current) {
      renderImage();
    }
  }, [imageLoaded, containerSize, renderImage]);

  // 更新動畫時長
  useEffect(() => {
    animDurationRef.current = Math.max(0, Math.floor(hoverPixelDuration || 0));
    const node = maskRef.current;
    if (node) {
      const ms = Math.max(0, Math.floor(hoverPixelDuration || 0));
      node.style.transition = `opacity ${ms}ms cubic-bezier(0.215, 0.61, 0.355, 1), background-color ${ms}ms cubic-bezier(0.215, 0.61, 0.355, 1)`;
    }
  }, [hoverPixelDuration]);

  // 當 pixelSize 改變時立即更新（非動畫狀態）
  useEffect(() => {
    if (!isAnimatingRef.current) {
      currentPixelSizeRef.current = pixelSize;
      targetPixelSizeRef.current = pixelSize;
      if (imageLoaded && isVisibleRef.current) {
        renderImage();
      }
    }
  }, [pixelSize, imageLoaded, renderImage]);

  // 處理 hoverActive 或 pointer events
  useEffect(() => {
    if (!hoverPixelToOne) return;
    
    const isActive = !!hoverActive;
    isHoveredRef.current = isActive;
    
    if (isActive) {
      // 進入 hover
      if (desaturateUntilHover && maskRef.current) {
        maskRef.current.style.backgroundColor = (maskColor as string) || 'var(--hds-sys-color-theme-mask)';
      }
      startAnimation(1, desaturateUntilHover ? Math.max(0, Math.min(1, maskOpacity)) : Math.max(0, Math.min(1, maskOpacity)));
    } else {
      // 離開 hover
      if (desaturateUntilHover && maskRef.current) {
        maskRef.current.style.backgroundColor = 'var(--hds-sys-color-theme-mask)';
      }
      startAnimation(pixelSize, desaturateUntilHover ? Math.max(0, Math.min(1, maskOpacity)) : 0);
    }
  }, [hoverActive, hoverPixelToOne, desaturateUntilHover, maskColor, maskOpacity, startAnimation, pixelSize]);

  // 遮罩初始狀態
  useEffect(() => {
    const node = maskRef.current;
    if (!node) return;
    
    if (desaturateUntilHover) {
      const baseOpacity = Math.max(0, Math.min(1, maskOpacity));
      node.style.backgroundColor = 'var(--hds-sys-color-theme-mask)';
      node.style.opacity = String(baseOpacity);
      lastAppliedMaskOpacityRef.current = baseOpacity;
      maskFromRef.current = baseOpacity;
      maskToRef.current = baseOpacity;
    } else {
      node.style.backgroundColor = (maskColor as string) || 'var(--hds-sys-color-theme-mask)';
      node.style.opacity = '0';
      lastAppliedMaskOpacityRef.current = 0;
      maskFromRef.current = 0;
      maskToRef.current = 0;
    }
  }, [desaturateUntilHover, maskColor, maskOpacity]);

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        if (!ref) return;
        if (typeof ref === 'function') ref(node as HTMLDivElement);
        else (ref as React.MutableRefObject<HTMLDivElement | null>).current = node as HTMLDivElement | null;
      }}
      className={`pixel-image pixel-image-2d ${className}`}
      style={{ width: '100%', height: '100%', position: 'relative', display: 'block' }}
      onPointerEnter={() => {
        if (hoverPixelToOne) {
          isHoveredRef.current = true;
          if (desaturateUntilHover && maskRef.current) {
            maskRef.current.style.backgroundColor = (maskColor as string) || 'var(--hds-sys-color-theme-mask)';
          }
          const targetMaskOpacity = desaturateUntilHover ? Math.max(0, Math.min(1, maskOpacity)) : Math.max(0, Math.min(1, maskOpacity));
          startAnimation(1, targetMaskOpacity);
        }
      }}
      onPointerLeave={() => {
        if (hoverPixelToOne) {
          isHoveredRef.current = false;
          if (desaturateUntilHover && maskRef.current) {
            maskRef.current.style.backgroundColor = 'var(--hds-sys-color-theme-mask)';
          }
          const targetMaskOpacity = desaturateUntilHover ? Math.max(0, Math.min(1, maskOpacity)) : 0;
          startAnimation(pixelSize, targetMaskOpacity);
        }
      }}
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
          backgroundColor: (maskColor as string) || 'var(--hds-sys-color-theme-mask)',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
});

PixelImage2D.displayName = 'PixelImage2D';

export { PixelImage2D };
export default PixelImage2D;
