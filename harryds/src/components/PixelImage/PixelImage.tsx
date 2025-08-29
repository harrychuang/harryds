// =============================================================================
// PIXEL IMAGE 元件 - 使用 Three.js RenderPixelatedPass 將圖片像素化
// 參考示例：webgl_postprocessing_pixel 與 RenderPixelatedPass API
// =============================================================================

import { useEffect, useRef, useState, useMemo, useCallback, forwardRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPixelatedPass } from 'three/examples/jsm/postprocessing/RenderPixelatedPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export type PixelImageObjectFit = 'cover' | 'contain' | 'fill';

export interface PixelImageProps {
  /** 圖片來源 URL */
  src: string;
  /** 像素大小（數值越大越粗） */
  pixelSize?: number;
  /** 滑鼠懸停時是否以補間動畫將像素大小緩動至 1，再移開恢復 */
  hoverPixelToOne?: boolean;
  /** 懸停像素補間動畫時長（毫秒） */
  hoverPixelDuration?: number;
  /** 是否顯示像素外框 */
  outline?: boolean;
  /** 外框：法線邊緣強度（0~1 建議） */
  normalEdgeStrength?: number;
  /** 外框：深度邊緣強度（0~1 建議） */
  depthEdgeStrength?: number;
  /** 外框：容差（越小越敏感） */
  normalTolerance?: number;
  /** 外框：深度容差（越小越敏感） */
  depthTolerance?: number;
  /** 背景色（預設透明） */
  backgroundColor?: string;
  /** DPR 上限，避免行動裝置過高像素比造成負擔 */
  maxPixelRatio?: number;
  /** 尺寸配置：圖片如何填滿容器 */
  objectFit?: PixelImageObjectFit;
  /** 額外 CSS 類名 */
  className?: string;
  /** 載入成功回呼 */
  onLoad?: () => void;
  /** 載入失敗回呼 */
  onError?: (error: unknown) => void;
}

const PixelImage = forwardRef<HTMLDivElement, PixelImageProps>(({
  src,
  pixelSize = 80,
  hoverPixelToOne = false,
  hoverPixelDuration = 280,
  outline = true,
  normalEdgeStrength = 0.2,
  depthEdgeStrength = 0.3,
  normalTolerance = 0.2,
  depthTolerance = 0.1,
  backgroundColor,
  maxPixelRatio = 1.5,
  objectFit = 'cover',
  className = '',
  onLoad,
  onError,
}, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);

  const planeRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const pixelPassRef = useRef<RenderPixelatedPass | null>(null);
  const rafRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const isVisibleRef = useRef<boolean>(true);
  const pixelSizeRef = useRef<number>(pixelSize);
  const lastAppliedPixelRef = useRef<number>(Math.max(1, Math.floor(pixelSize)));
  const isHoveredRef = useRef<boolean>(false);
  const isAnimatingRef = useRef<boolean>(false);
  const animStartRef = useRef<number>(0);
  const animFromRef = useRef<number>(0);
  const animToRef = useRef<number>(1);
  const animDurationRef = useRef<number>(280);

  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 300, height: 200 });
  const containerSizeRef = useRef<{ width: number; height: number }>({ width: 300, height: 200 });

  const edgeParams = useMemo(() => {
    return {
      normalEdgeStrength: outline ? normalEdgeStrength : 0,
      depthEdgeStrength: outline ? depthEdgeStrength : 0,
      normalTolerance,
      depthTolerance,
    };
  }, [outline, normalEdgeStrength, depthEdgeStrength, normalTolerance, depthTolerance]);

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const renderLoop = useCallback(() => {
    if (!rendererRef.current || !composerRef.current) return;
    rafRef.current = requestAnimationFrame(renderLoop);

    // 動畫補間（僅在需要時運算）
    const pass = pixelPassRef.current;
    if (pass && isAnimatingRef.current) {
      const now = performance.now();
      const t = Math.min(1, (now - animStartRef.current) / Math.max(1, animDurationRef.current));
      // easing: easeOutCubic
      const k = 1 - Math.pow(1 - t, 3);
      const current = animFromRef.current + (animToRef.current - animFromRef.current) * k;
      const rounded = Math.max(1, Math.round(current));
      if (rounded !== lastAppliedPixelRef.current) {
        pass.setPixelSize(rounded);
        lastAppliedPixelRef.current = rounded;
      }
      if (t >= 1) {
        isAnimatingRef.current = false;
      }
    }

    composerRef.current.render();
  }, []);

  const updateCamera = useCallback((width: number, height: number) => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.updateProjectionMatrix();
  }, []);

  const fitPlaneToContainer = useCallback((imgW: number, imgH: number, viewW: number, viewH: number) => {
    if (!planeRef.current) return;

    const imageAspect = imgW / imgH;
    const viewAspect = viewW / viewH;

    let targetW = viewW;
    let targetH = viewH;

    if (objectFit === 'fill') {
      targetW = viewW;
      targetH = viewH;
    } else if (objectFit === 'contain') {
      if (imageAspect > viewAspect) {
        targetW = viewW;
        targetH = viewW / imageAspect;
      } else {
        targetH = viewH;
        targetW = viewH * imageAspect;
      }
    } else {
      // cover
      if (imageAspect > viewAspect) {
        targetH = viewH;
        targetW = viewH * imageAspect;
      } else {
        targetW = viewW;
        targetH = viewW / imageAspect;
      }
    }

    planeRef.current.scale.set(targetW, targetH, 1);
  }, [objectFit]);

  const computeEffectivePixel = useCallback((base: number) => {
    const aw = Math.max(1, Math.floor(containerSizeRef.current.width));
    const ah = Math.max(1, Math.floor(containerSizeRef.current.height));
    const maxByW = Math.max(1, Math.floor(aw / 2));
    const maxByH = Math.max(1, Math.floor(ah / 2));
    return Math.max(1, Math.min(Math.floor(base), maxByW, maxByH));
  }, []);

  const setupThree = useCallback((width: number, height: number) => {
    if (!canvasRef.current) return;

    // renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
      premultipliedAlpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
    renderer.setSize(width, height);
    // 明確指定輸出色域與 tone mapping
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1;
    if (backgroundColor) {
      renderer.setClearColor(new THREE.Color(backgroundColor), 1);
    } else {
      renderer.setClearColor(0x000000, 0);
    }

    // scene & camera
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.1, 1000);
    camera.position.z = 1;

    // plane to hold image
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, toneMapped: false });
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // composer + pixelated pass
    // 以 CSS 尺寸限制像素大小，確保低解析 render target 至少為 2×2。
    const getEffectivePixel = () => {
      const aw = Math.max(1, Math.floor(width));
      const ah = Math.max(1, Math.floor(height));
      const maxByW = Math.max(1, Math.floor(aw / 2));
      const maxByH = Math.max(1, Math.floor(ah / 2));
      return Math.max(1, Math.min(Math.floor(pixelSizeRef.current), maxByW, maxByH));
    };
    const effectivePixel = getEffectivePixel();
    const composer = new EffectComposer(renderer);
    const pixelPass = new RenderPixelatedPass(effectivePixel, scene, camera, edgeParams);
    composer.addPass(pixelPass);
    // 後處理鏈色彩收尾（線性 → sRGB）
    composer.addPass(new OutputPass());

    // assign refs
    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    composerRef.current = composer;
    pixelPassRef.current = pixelPass;
    planeRef.current = plane;

    updateCamera(width, height);
  }, [maxPixelRatio, updateCamera]);

  const disposeThree = useCallback(() => {
    stopLoop();

    if (composerRef.current) {
      composerRef.current.dispose();
      composerRef.current = null;
    }

    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    if (sceneRef.current) {
      sceneRef.current.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else if (mesh.material) {
            (mesh.material as THREE.Material).dispose();
          }
        }
      });
      sceneRef.current.clear();
      sceneRef.current = null;
    }

    if (textureRef.current) {
      textureRef.current.dispose();
      textureRef.current = null;
    }

    planeRef.current = null;
    cameraRef.current = null;
    pixelPassRef.current = null;
  }, [stopLoop]);

  const loadTexture = useCallback(async (url: string) => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    return await new Promise<THREE.Texture>((resolve, reject) => {
      loader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.generateMipmaps = false;
          resolve(tex);
        },
        undefined,
        (err) => reject(err)
      );
    });
  }, []);

  const applyTextureToPlane = useCallback((tex: THREE.Texture) => {
    if (!planeRef.current) return;
    if (!sceneRef.current) return;

    const material = planeRef.current.material;
    material.map = tex;
    material.needsUpdate = true;

    const img = tex.image as HTMLImageElement | { width: number; height: number };
    const w = img.width;
    const h = img.height;
    fitPlaneToContainer(w, h, containerSize.width, containerSize.height);
  }, [containerSize.height, containerSize.width, fitPlaneToContainer]);

  const rebuildPixelPass = useCallback(() => {
    if (!composerRef.current || !sceneRef.current || !cameraRef.current) return;
    if (pixelPassRef.current) {
      // EffectComposer 沒有提供 removePass 的型別定義，但實作上支援
      // 這裡直接重建 composer 以保守處理
      const renderer = rendererRef.current!;
      const width = containerSizeRef.current.width;
      const height = containerSizeRef.current.height;
      composerRef.current.dispose();
      const composer = new EffectComposer(renderer);
      // 以 CSS 尺寸限制像素大小
      const aw = Math.max(1, Math.floor(width));
      const ah = Math.max(1, Math.floor(height));
      const maxByW = Math.max(1, Math.floor(aw / 2));
      const maxByH = Math.max(1, Math.floor(ah / 2));
      const effectivePixel = Math.max(1, Math.min(Math.floor(pixelSizeRef.current), maxByW, maxByH));
      const pixelPass = new RenderPixelatedPass(effectivePixel, sceneRef.current, cameraRef.current, edgeParams);
      composer.addPass(pixelPass);
      composer.addPass(new OutputPass());
      composer.setSize(width, height);
      composerRef.current = composer;
      pixelPassRef.current = pixelPass;
      lastAppliedPixelRef.current = effectivePixel;
    }
  }, [edgeParams]);

  const handleResize = useCallback((width: number, height: number) => {
    setContainerSize({ width, height });
    containerSizeRef.current = { width, height };
    if (!rendererRef.current || !composerRef.current) return;
    rendererRef.current.setSize(width, height);
    composerRef.current.setSize(width, height);
    updateCamera(width, height);

    // 依照新尺寸重新配適圖片平面
    if (textureRef.current) {
      const img = textureRef.current.image as HTMLImageElement | { width: number; height: number };
      fitPlaneToContainer(img.width, img.height, width, height);
    }
  }, [fitPlaneToContainer, updateCamera]);

  // 初始化與銷毀
  useEffect(() => {
    const el = (ref as React.RefObject<HTMLDivElement>)?.current || containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const initialW = Math.max(1, Math.round(rect.width));
    const initialH = Math.max(1, Math.round(rect.height));
    setContainerSize({ width: initialW, height: initialH });
    setupThree(initialW, initialH);

    // ResizeObserver 監聽容器尺寸
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const box = entry.contentRect;
      handleResize(Math.max(1, Math.round(box.width)), Math.max(1, Math.round(box.height)));
    });
    ro.observe(el);
    resizeObserverRef.current = ro;

    // IntersectionObserver 控制渲染循環節省資源
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      const visible = entry.isIntersecting && entry.intersectionRatio > 0;
      isVisibleRef.current = visible;
      if (visible) {
        if (rafRef.current == null) renderLoop();
      } else {
        stopLoop();
      }
    }, { threshold: [0, 0.01] });
    io.observe(el);

    // 頁面可見性變化
    const onVis = () => {
      if (document.hidden) {
        stopLoop();
      } else if (isVisibleRef.current && rafRef.current == null) {
        renderLoop();
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
      disposeThree();
    };
  }, [disposeThree, handleResize, renderLoop, setupThree, ref, stopLoop]);

  // 載入與套用圖片
  useEffect(() => {
    let mounted = true;
    if (!src) return;

    (async () => {
      try {
        const tex = await loadTexture(src);
        if (!mounted) return;
        textureRef.current = tex;
        applyTextureToPlane(tex);
        if (onLoad) onLoad();
        if (rafRef.current == null && isVisibleRef.current) renderLoop();
      } catch (err) {
        if (onError) onError(err);
        // 若失敗仍啟動渲染迴圈，以保持透明背景
        if (rafRef.current == null && isVisibleRef.current) renderLoop();
      }
    })();

    return () => {
      mounted = false;
    };
  }, [applyTextureToPlane, loadTexture, onError, onLoad, renderLoop, src]);

  // 當描邊參數或容器尺寸改變時，重建像素化 pass（pixelSize 不觸發重建）
  useEffect(() => {
    rebuildPixelPass();
  }, [rebuildPixelPass]);

  // 像素大小即時更新：直接透過 pass.setPixelSize 觸發重算，避免重建造成的空窗
  useEffect(() => {
    const renderer = rendererRef.current;
    const composer = composerRef.current;
    const pass = pixelPassRef.current;
    if (!renderer || !composer || !pass) return;

    const effectivePixel = computeEffectivePixel(pixelSize);

    pass.setPixelSize(effectivePixel);
    lastAppliedPixelRef.current = effectivePixel;

    if (rafRef.current == null && isVisibleRef.current) {
      renderLoop();
    }
  }, [pixelSize, computeEffectivePixel, renderLoop]);

  // 追蹤最新的 pixelSize 供重建 pass 使用，但不觸發重建依賴
  useEffect(() => {
    pixelSizeRef.current = pixelSize;
  }, [pixelSize]);

  // 追蹤動畫時長
  useEffect(() => {
    animDurationRef.current = Math.max(0, Math.floor(hoverPixelDuration || 0));
  }, [hoverPixelDuration]);

  // objectFit 改變時重新配適圖片平面
  useEffect(() => {
    if (!textureRef.current) return;
    const img = textureRef.current.image as HTMLImageElement | { width: number; height: number };
    fitPlaneToContainer(img.width, img.height, containerSize.width, containerSize.height);
  }, [objectFit, containerSize.height, containerSize.width, fitPlaneToContainer]);

  // 背景色即時更新，不重建場景/Composer
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    if (backgroundColor) {
      renderer.setClearColor(new THREE.Color(backgroundColor), 1);
    } else {
      renderer.setClearColor(0x000000, 0);
    }
    if (rafRef.current == null && isVisibleRef.current) {
      renderLoop();
    }
  }, [backgroundColor, renderLoop]);

  // 滑鼠懸停動畫：事件處理與啟動補間
  const startPixelAnimation = useCallback((toPixel: number) => {
    const pass = pixelPassRef.current;
    if (!hoverPixelToOne || !pass) return;
    animFromRef.current = lastAppliedPixelRef.current;
    animToRef.current = toPixel;
    animStartRef.current = performance.now();
    isAnimatingRef.current = true;
    if (rafRef.current == null && isVisibleRef.current) {
      renderLoop();
    }
  }, [hoverPixelToOne, renderLoop]);

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        if (!ref) return;
        if (typeof ref === 'function') ref(node as HTMLDivElement);
        else (ref as React.MutableRefObject<HTMLDivElement | null>).current = node as HTMLDivElement | null;
      }}
      className={`pixel-image ${className}`}
      style={{ width: '100%', height: '100%', position: 'relative', display: 'block' }}
      onPointerEnter={() => {
        if (!hoverPixelToOne) return;
        isHoveredRef.current = true;
        startPixelAnimation(1);
      }}
      onPointerLeave={() => {
        if (!hoverPixelToOne) return;
        isHoveredRef.current = false;
        const backTo = computeEffectivePixel(pixelSizeRef.current);
        startPixelAnimation(backTo);
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
});

PixelImage.displayName = 'PixelImage';

export { PixelImage };
export default PixelImage;


