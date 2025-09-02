// =============================================================================
// DISTORTED PIXELS 2D 元件 - 使用 2D Canvas 實現滾動扭曲與像素化
// 與三維版保持相同 API，並參考 PixelImage2D 的 DPR、佈局與效能處理
// =============================================================================

import { useEffect, useRef, useState, useCallback, forwardRef } from 'react';
import type { DistortedPixelsProps, DistortedPixelsObjectFit } from './DistortedPixels';

type ContainerSize = { width: number; height: number };

// 簡單雜湊函數（對應著色器中的 hash）
const hash1 = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// const clamp01 = (v: number) => Math.max(0, Math.min(1, v)); // 未使用

const DistortedPixels2D = forwardRef<HTMLDivElement, DistortedPixelsProps>(({
  src,
  objectFit = 'cover',
  direction = 'x',
  maxPixelation = 150,
  maxDistortion = 0,
  scrollSensitivity = 0.1,
  decaySpeed = 0.95,
  maxPixelRatio = 4,
  // 2D 版本暫不使用 adaptiveQuality 與 minQualityScale，但保留 API 一致性
  adaptiveQuality: _adaptiveQuality = true,
  minQualityScale: _minQualityScale = 0.6,
  scrollContainer,
  className = '',
  onLoad,
  onError,
  onHeightChange,
  debug = false,
}, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const maskRef = useRef<HTMLDivElement | null>(null); // 保留用於未來需要覆蓋層時

  const offscreenSmallRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenSmallCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const rafRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);

  // 滾動與動畫狀態
  const scrollYRef = useRef<number>(0);
  const scrollVelocityRef = useRef<number>(0);
  const lastScrollTimeRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const currentPixelationRef = useRef<number>(0);
  const currentDistortionRef = useRef<number>(0);
  const isVisibleRef = useRef<boolean>(true);

  // 容器尺寸、圖片載入與 responsive 高度
  const [containerSize, setContainerSize] = useState<ContainerSize>({ width: 300, height: 200 });
  const containerSizeRef = useRef<ContainerSize>({ width: 300, height: 200 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [responsiveHeight, setResponsiveHeight] = useState<number | null>(null);

  // 調試資訊
  const [effectValues, setEffectValues] = useState({
    pixelation: 0,
    distortion: 0,
    scrollVelocity: 0,
  });

  // 計算圖片在容器中的位置與大小
  const calculateImageLayout = useCallback((imgW: number, imgH: number, viewW: number, viewH: number, fit: DistortedPixelsObjectFit) => {
    const imageAspect = imgW / imgH;
    const viewAspect = viewW / viewH;

    let targetW = viewW;
    let targetH = viewH;
    let offsetX = 0;
    let offsetY = 0;

    if (fit === 'fill') {
      targetW = viewW;
      targetH = viewH;
    } else if (fit === 'contain') {
      if (imageAspect > viewAspect) {
        targetW = viewW;
        targetH = viewW / imageAspect;
        offsetY = (viewH - targetH) / 2;
      } else {
        targetH = viewH;
        targetW = viewH * imageAspect;
        offsetX = (viewW - targetW) / 2;
      }
    } else if (fit === 'responsive') {
      targetW = viewW;
      targetH = viewW / imageAspect;
      offsetX = 0;
      offsetY = 0;
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
  }, []);

  // 初始化/取得離屏小畫布（用於像素取樣）
  const getOffscreenSmall = useCallback(() => {
    if (!offscreenSmallRef.current) {
      offscreenSmallRef.current = document.createElement('canvas');
      offscreenSmallCtxRef.current = offscreenSmallRef.current.getContext('2d');
    }
    return { canvas: offscreenSmallRef.current!, ctx: offscreenSmallCtxRef.current };
  }, []);

  // 計算有效像素尺寸（避免像素過大導致取樣太小）
  const computeEffectivePixel = useCallback((base: number) => {
    const aw = Math.max(1, Math.floor(containerSizeRef.current.width || 1));
    const ah = Math.max(1, Math.floor(containerSizeRef.current.height || 1));
    const maxByW = Math.max(1, Math.floor(aw / 2));
    const maxByH = Math.max(1, Math.floor(ah / 2));
    return Math.max(1, Math.min(Math.floor(base), maxByW, maxByH));
  }, []);

  // 渲染一幀
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const { width: viewW, height: viewH } = containerSizeRef.current;

    // 在 responsive 模式下，若容器高度尚未建立（0），先行根據圖片比例計算並設定高度，
    // 避免因為早期 return 導致後續高度一直為 0 而無法渲染與觸發效果。
    if (
      objectFit === 'responsive' &&
      imageLoaded &&
      viewW > 0 &&
      viewH <= 0 &&
      (responsiveHeight == null)
    ) {
      const img = imageRef.current;
      if (img && img.width > 0 && img.height > 0) {
        const targetH = Math.max(1, Math.round(viewW / (img.width / img.height)));
        setResponsiveHeight(targetH);
        onHeightChange && onHeightChange(targetH);
      }
      // 等下一幀由 ResizeObserver/狀態更新帶入正確高度後再渲染
      return;
    }

    if (viewW <= 0 || viewH <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 設置 canvas 尺寸與縮放
    canvas.width = Math.max(1, Math.floor(viewW * dpr));
    canvas.height = Math.max(1, Math.floor(viewH * dpr));
    canvas.style.width = `${viewW}px`;
    canvas.style.height = `${viewH}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, viewW, viewH);

    // 計算佈局（含 responsive 情境）
    const layout = calculateImageLayout(img.width, img.height, viewW, viewH, objectFit);
    if (objectFit === 'responsive') {
      if (responsiveHeight == null || Math.abs(responsiveHeight - layout.targetH) > 1) {
        setResponsiveHeight(layout.targetH);
        onHeightChange && onHeightChange(layout.targetH);
      }
    }
    if (layout.targetW <= 0 || layout.targetH <= 0) return;

    // 基線：當效果很小（初始或靜止時），直接繪製原圖
    // 與 3D 版一致採較寬鬆的閾值，避免看似「卡住」的小殘留像素
    if (currentPixelationRef.current < 5 && currentDistortionRef.current < 0.05) {
      ctx.drawImage(
        img,
        0, 0, img.width, img.height,
        Math.round(layout.offsetX),
        Math.round(layout.offsetY),
        Math.round(layout.targetW),
        Math.round(layout.targetH)
      );
      // 若為 responsive，已在上方處理高度同步
      if (debug) {
        setEffectValues({
          pixelation: 0,
          distortion: 0,
          scrollVelocity: Math.round(scrollVelocityRef.current * 100) / 100,
        });
      }
      return;
    }

    // 先將原圖縮小取樣到小畫布（像素化）
    const { canvas: smallCanvas, ctx: smallCtx } = getOffscreenSmall();
    if (!smallCtx) {
      // 防呆：若無 2D context，改用直接繪製
      ctx.drawImage(
        img,
        0, 0, img.width, img.height,
        Math.round(layout.offsetX),
        Math.round(layout.offsetY),
        Math.round(layout.targetW),
        Math.round(layout.targetH)
      );
      return;
    }

    const pixelBlock = computeEffectivePixel(currentPixelationRef.current);
    const blocksX = Math.max(1, Math.floor(layout.targetW / Math.max(1, pixelBlock)));
    const blocksY = Math.max(1, Math.floor(layout.targetH / Math.max(1, pixelBlock)));

    smallCanvas.width = blocksX;
    smallCanvas.height = blocksY;
    smallCtx.imageSmoothingEnabled = false;
    smallCtx.clearRect(0, 0, blocksX, blocksY);
    smallCtx.drawImage(img, 0, 0, blocksX, blocksY);

    // 將小畫布放大回主畫布，同時進行條帶式扭曲繪製
    const cellW = layout.targetW / blocksX;
    const cellH = layout.targetH / blocksY;

    const t = timeRef.current;
    const distortion = currentDistortionRef.current; // 0..maxDistortion

    if (direction === 'x') {
      // 水平扭曲：以列為單位，沿 X 軸拖影
      for (let row = 0; row < blocksY; row++) {
        const rowHash = hash1(row * 0.07 + 0.987);
        const phase = hash1(row * 0.07 + 6.28) * Math.PI * 2;
        const dir = Math.sign(Math.sin(t * 1.5 + phase)) || 1;
        const smearLenUV = (0.02 + rowHash * 0.04) * distortion; // uv 空間
        const smearLenPx = smearLenUV * layout.targetW; // 像素空間
        const offset = smearLenPx * dir;

        const sy = row; // 小畫布 y
        const dy = Math.round(layout.offsetY + row * cellH);

        // 來自小畫布的該列（高度 1）擴大至 cellH
        ctx.drawImage(
          smallCanvas,
          0, sy, blocksX, 1,
          Math.round(layout.offsetX + offset), dy, Math.round(layout.targetW), Math.ceil(cellH)
        );
      }
    } else {
      // 垂直扭曲：以欄為單位，沿 Y 軸拖影
      for (let col = 0; col < blocksX; col++) {
        const colHash = hash1(col * 0.07 + 0.123);
        const phase = hash1(col * 0.07 + 3.14) * Math.PI * 2;
        const dir = Math.sign(Math.sin(t * 1.5 + phase)) || 1;
        const smearLenUV = (0.02 + colHash * 0.04) * distortion; // uv 空間
        const smearLenPx = smearLenUV * layout.targetH; // 像素空間
        const offset = smearLenPx * dir;

        const sx = col; // 小畫布 x
        const dx = Math.round(layout.offsetX + col * cellW);

        ctx.drawImage(
          smallCanvas,
          sx, 0, 1, blocksY,
          dx, Math.round(layout.offsetY + offset), Math.ceil(cellW), Math.round(layout.targetH)
        );
      }
    }

    // 更新調試面板
    if (debug) {
      setEffectValues({
        pixelation: Math.round(currentPixelationRef.current * 10) / 10,
        distortion: Math.round(currentDistortionRef.current * 100) / 100,
        scrollVelocity: Math.round(scrollVelocityRef.current * 100) / 100,
      });
    }
  }, [imageLoaded, maxPixelRatio, calculateImageLayout, objectFit, getOffscreenSmall, computeEffectivePixel, debug, responsiveHeight, onHeightChange, direction]);

  // 動畫迴圈
  const renderLoop = useCallback(() => {
    rafRef.current = requestAnimationFrame(renderLoop);

    // 時間累加
    timeRef.current += 0.01;

    // 計算目標效果
    const targetPixelation = Math.min(scrollVelocityRef.current * maxPixelation, maxPixelation);
    const targetDistortion = Math.min(scrollVelocityRef.current * maxDistortion, maxDistortion);

    // 平滑過渡
    currentPixelationRef.current = currentPixelationRef.current + (targetPixelation - currentPixelationRef.current) * (1 - decaySpeed);
    currentDistortionRef.current = currentDistortionRef.current + (targetDistortion - currentDistortionRef.current) * (1 - decaySpeed);

    renderFrame();

    // 滾動速度自然衰減
    scrollVelocityRef.current *= decaySpeed;
    if (scrollVelocityRef.current < 0.001) scrollVelocityRef.current = 0;

    // 若無效果且非 debug，停止迴圈
    if (!debug && currentPixelationRef.current < 0.01 && currentDistortionRef.current < 0.01 && scrollVelocityRef.current === 0) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
  }, [maxPixelation, maxDistortion, decaySpeed, debug, renderFrame]);

  // 確保在需要時持續運行動畫（避免因可見性或其他原因被過早停止）
  const ensureLoop = useCallback(() => {
    const needRun = isVisibleRef.current ||
      currentPixelationRef.current > 0.01 ||
      currentDistortionRef.current > 0.01 ||
      scrollVelocityRef.current > 0;
    if (needRun && rafRef.current == null) {
      rafRef.current = requestAnimationFrame(renderLoop);
    }
  }, [renderLoop]);

  // 停止動畫
  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // 滾動速度更新
  const updateScrollVelocity = useCallback(() => {
    const currentTime = performance.now();
    let currentScrollY: number;
    if (scrollContainer) {
      const container = scrollContainer instanceof HTMLElement ? scrollContainer : scrollContainer.current;
      currentScrollY = container ? container.scrollTop : 0;
    } else {
      currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
    }

    const dt = currentTime - lastScrollTimeRef.current;
    const ds = currentScrollY - scrollYRef.current;
    if (dt > 0) {
      const rawV = Math.abs(ds / dt);
      scrollVelocityRef.current = rawV * scrollSensitivity;
    }
    scrollYRef.current = currentScrollY;
    lastScrollTimeRef.current = currentTime;

    if (rafRef.current == null && isVisibleRef.current) {
      rafRef.current = requestAnimationFrame(renderLoop);
    }
  }, [scrollSensitivity, scrollContainer, renderLoop]);

  // 初始化：尺寸、圖片、觀察者與事件
  useEffect(() => {
    const el = (ref as React.RefObject<HTMLDivElement>)?.current || containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const initialWidth = Math.max(1, Math.round(rect.width));
    const initialHeight = Math.max(1, Math.round(rect.height));
    setContainerSize({ width: initialWidth, height: initialHeight });
    containerSizeRef.current = { width: initialWidth, height: initialHeight };

    // 載入圖片
    let mounted = true;
    setImageLoaded(false);
    imageRef.current = null;
    const img = new Image();
    // 僅對跨網域來源設定 crossOrigin，避免同源在部分環境被視為 CORS 圖像而無法繪製
    try {
      const isAbsolute = /^https?:\/\//i.test(src);
      if (isAbsolute) {
        const srcURL = new URL(src);
        if (srcURL.origin !== window.location.origin) {
          img.crossOrigin = 'anonymous';
        }
      }
    } catch (_) { /* 忽略 URL 解析例外 */ }
    // 提示瀏覽器先解碼
    (img as any).decoding = 'async';
    const handleLoaded = () => {
      if (!mounted) return;
      imageRef.current = img;
      setImageLoaded(true);
      onLoad && onLoad();
      if (rafRef.current == null && isVisibleRef.current) rafRef.current = requestAnimationFrame(renderLoop);
    };
    img.onload = handleLoaded;
    img.onerror = (err) => {
      if (!mounted) return;
      onError && onError(err);
      ensureLoop();
    };
    img.src = src;
    // 若圖片已在快取中且立即可用
    if (img.complete && (img.naturalWidth || 0) > 0) {
      handleLoaded();
    } else if (typeof (img as any).decode === 'function') {
      (img as any).decode().then(() => handleLoaded()).catch(() => {/* 交給 onload/onerror */});
    }

    // ResizeObserver
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      const w = Math.max(1, Math.round(width));
      const h = Math.max(1, Math.round(height));
      setContainerSize({ width: w, height: h });
      containerSizeRef.current = { width: w, height: h };
      ensureLoop();
    });
    ro.observe(el);
    resizeObserverRef.current = ro;

    // IntersectionObserver 控制是否渲染
    const resolveRoot = (): Element | null => {
      if (!scrollContainer) return null;
      return (scrollContainer instanceof HTMLElement ? scrollContainer : scrollContainer.current) || null;
    };

    let ioRoot: Element | null = resolveRoot();
    const createIO = (root: Element | null) => new IntersectionObserver((entries) => {
      const entry = entries[0];
      const visible = entry.isIntersecting && entry.intersectionRatio > 0;
      isVisibleRef.current = visible;
      if (visible) {
        ensureLoop();
      } else {
        // 在不可見時，若效果尚未恢復，仍持續運行到恢復為止
        if (currentPixelationRef.current > 0.01 || currentDistortionRef.current > 0.01 || scrollVelocityRef.current > 0) {
          ensureLoop();
        } else {
          stopLoop();
        }
      }
    }, { root: root || null, threshold: [0, 0.01] });

    let io = createIO(ioRoot);
    io.observe(el);
    intersectionObserverRef.current = io;

    // 嘗試在 root 尚未就緒時，切換到正確的 scroll 容器作為 root
    const rafIdForRoot = requestAnimationFrame(() => {
      const newRoot = resolveRoot();
      if (newRoot && newRoot !== ioRoot) {
        io.disconnect();
        ioRoot = newRoot;
        io = createIO(ioRoot);
        io.observe(el);
        intersectionObserverRef.current = io;
      }
    });

    const intervalIdForRoot = window.setInterval(() => {
      const newRoot = resolveRoot();
      if (newRoot && newRoot !== ioRoot) {
        io.disconnect();
        ioRoot = newRoot;
        io = createIO(ioRoot);
        io.observe(el);
        intersectionObserverRef.current = io;
        clearInterval(intervalIdForRoot);
      }
    }, 300);

    // 可見性變更
    const handleVisibility = () => {
      if (document.hidden) {
        // 若尚未恢復，仍可選擇持續衰減直到回到基線
        if (currentPixelationRef.current <= 0.01 && currentDistortionRef.current <= 0.01 && scrollVelocityRef.current === 0) {
          stopLoop();
        }
      } else {
        ensureLoop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
        intersectionObserverRef.current = null;
      }
      cancelAnimationFrame(rafIdForRoot);
      clearInterval(intervalIdForRoot);
      stopLoop();
    };
  }, [src]);

  // 滾動事件註冊（支援 scrollContainer 於初始為 null，之後再切換）
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateScrollVelocity();
          ticking = false;
        });
        ticking = true;
      }
    };

    const resolveTarget = (): HTMLElement | null => {
      if (!scrollContainer) return null;
      return scrollContainer instanceof HTMLElement ? scrollContainer : scrollContainer.current;
    };

    let scrollElement: HTMLElement | Window = window;

    const attach = (el: HTMLElement | Window) => {
      // 初始化滾動值
      if (el === window) {
        scrollYRef.current = window.pageYOffset || document.documentElement.scrollTop;
      } else {
        scrollYRef.current = (el as HTMLElement).scrollTop;
      }
      lastScrollTimeRef.current = performance.now();
      (el as any).addEventListener('scroll', onScroll, { passive: true } as AddEventListenerOptions);
    };

    const detach = (el: HTMLElement | Window) => {
      (el as any).removeEventListener('scroll', onScroll as EventListener);
    };

    // 先綁定 window，確保有事件來源
    attach(scrollElement);

    // 嘗試在下一幀與之後輪詢切換到正確的容器
    const tryBind = () => {
      const target = resolveTarget();
      if (target && target !== scrollElement) {
        detach(scrollElement);
        scrollElement = target;
        attach(scrollElement);
      }
    };

    const rafId = requestAnimationFrame(tryBind);
    const intervalId = window.setInterval(tryBind, 300);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(intervalId);
      detach(scrollElement);
    };
  }, [updateScrollVelocity, scrollContainer]);

  // 當 scrollContainer 變化時，重新設定 IntersectionObserver 的 root
  useEffect(() => {
    if (!intersectionObserverRef.current) return;
    
    const el = (ref as React.RefObject<HTMLDivElement>)?.current || containerRef.current;
    if (!el) return;

    const resolveRoot = (): Element | null => {
      if (!scrollContainer) return null;
      return (scrollContainer instanceof HTMLElement ? scrollContainer : scrollContainer.current) || null;
    };

    const newRoot = resolveRoot();
    const createIO = (root: Element | null) => new IntersectionObserver((entries) => {
      const entry = entries[0];
      const visible = entry.isIntersecting && entry.intersectionRatio > 0;
      isVisibleRef.current = visible;
      if (visible) {
        ensureLoop();
      } else {
        if (currentPixelationRef.current > 0.01 || currentDistortionRef.current > 0.01 || scrollVelocityRef.current > 0) {
          ensureLoop();
        } else {
          stopLoop();
        }
      }
    }, { root: root || null, threshold: [0, 0.01] });

    // 重新創建 IntersectionObserver
    intersectionObserverRef.current.disconnect();
    const newIO = createIO(newRoot);
    newIO.observe(el);
    intersectionObserverRef.current = newIO;
  }, [scrollContainer, ensureLoop, stopLoop]);

  // 當 objectFit 改變時，若為 responsive 需要更新高度
  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;
    const { width: viewW, height: viewH } = containerSizeRef.current;
    const layout = calculateImageLayout(img.width, img.height, viewW, viewH, objectFit);
    if (objectFit === 'responsive') {
      if (responsiveHeight == null || Math.abs(responsiveHeight - layout.targetH) > 1) {
        setResponsiveHeight(layout.targetH);
        onHeightChange && onHeightChange(layout.targetH);
      }
    }
    if (rafRef.current == null && isVisibleRef.current) rafRef.current = requestAnimationFrame(renderLoop);
  }, [objectFit, onHeightChange, calculateImageLayout, renderLoop, responsiveHeight]);

  // 更新 DPR 上限時刷新
  useEffect(() => {
    if (rafRef.current == null && isVisibleRef.current) {
      rafRef.current = requestAnimationFrame(renderLoop);
    }
  }, [maxPixelRatio, renderLoop]);

  // 圖片與尺寸就緒時，至少渲染一次基線畫面
  useEffect(() => {
    if (imageLoaded && containerSize.width > 0 && containerSize.height > 0) {
      renderFrame();
    }
  }, [imageLoaded, containerSize.width, containerSize.height, renderFrame]);

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        if (ref) {
          if (typeof ref === 'function') ref(node);
          else ref.current = node;
        }
      }}
      className={`distorted-pixels distorted-pixels-2d ${className}`.trim()}
      style={{
        width: '100%',
        height: objectFit === 'responsive' && responsiveHeight ? `${responsiveHeight}px` : '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {debug && (
        <div
          className="debug-overlay"
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: 4,
            fontFamily: 'monospace',
            fontSize: '12px',
            zIndex: 1000,
          }}
        >
          <div style={{ color: '#ff6b6b' }}>像素化: {effectValues.pixelation}</div>
          <div style={{ color: '#4ecdc4' }}>扭曲: {effectValues.distortion}</div>
          <div style={{ color: '#45b7d1' }}>滾動速度: {effectValues.scrollVelocity}</div>
        </div>
      )}

      {/* 保留遮罩節點以便擴充（目前未使用） */}
      <div ref={maskRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
    </div>
  );
});

DistortedPixels2D.displayName = 'DistortedPixels2D';

export { DistortedPixels2D };
export default DistortedPixels2D;


