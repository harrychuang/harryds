// =============================================================================
// DISTORTED PIXELS 元件 - 響應滾動的扭曲像素化圖片
// 參考 akella/DistortedPixels，實現滾動加速時的垂直撕裂和像素化效果
// =============================================================================

import { useEffect, useRef, useState, useMemo, useCallback, forwardRef } from 'react';
import * as THREE from 'three';

export type DistortedPixelsObjectFit = 'cover' | 'contain' | 'fill';

export interface DistortedPixelsProps {
  /** 圖片來源 URL */
  src: string;
  /** 尺寸配置：圖片如何填滿容器 */
  objectFit?: DistortedPixelsObjectFit;
  /** 最大像素化程度（數值越大越粗糙，0-100） */
  maxPixelation?: number;
  /** 最大扭曲強度（0-1） */
  maxDistortion?: number;
  /** 滾動響應靈敏度（數值越大越敏感） */
  scrollSensitivity?: number;
  /** 效果衰減速度（數值越大衰減越快） */
  decaySpeed?: number;
  /** DPR 上限，避免行動裝置過高像素比造成負擔 */
  maxPixelRatio?: number;
  /** 額外 CSS 類名 */
  className?: string;
  /** 載入成功回呼 */
  onLoad?: () => void;
  /** 載入失敗回呼 */
  onError?: (error: unknown) => void;
  /** 是否啟用調試模式（顯示效果參數） */
  debug?: boolean;
}

// 自定義著色器
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform float uPixelation;
  uniform float uDistortion;
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;
  
  void main() {
    vec2 uv = vUv;
    
    // 垂直扭曲效果（基於滾動）
    float wave = sin(uv.y * 10.0 + uTime * 2.0) * uDistortion * 0.1;
    float tear = sin(uv.y * 50.0 + uTime * 5.0) * uDistortion * 0.05;
    uv.x += wave + tear;
    
    // 垂直像素化效果（只在 Y 軸方向）
    if (uPixelation > 0.0) {
      float pixelSize = uPixelation * 0.01; // 將 0-100 轉為 0-1
      // 只對 Y 軸進行像素化，X 軸保持原始解析度
      uv.y = floor(uv.y / pixelSize) * pixelSize;
    }
    
    // 邊界檢查
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }
    
    vec4 color = texture2D(uTexture, uv);
    
    // 添加一些數字雜訊增強撕裂感
    float noise = fract(sin(dot(uv.xy, vec2(12.9898, 78.233))) * 43758.5453) * 2.0 - 1.0;
    color.rgb += noise * uDistortion * 0.02;
    
    gl_FragColor = color;
  }
`;

const DistortedPixels = forwardRef<HTMLDivElement, DistortedPixelsProps>(({
  src,
  objectFit = 'cover',
  maxPixelation = 50,
  maxDistortion = 1.0,
  scrollSensitivity = 0.2,
  decaySpeed = 0.95,
  maxPixelRatio = 4,
  className = '',
  onLoad,
  onError,
  debug = false,
}, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Three.js 引用
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  
  // 動畫和滾動狀態
  const rafRef = useRef<number | null>(null);
  const scrollYRef = useRef<number>(0);
  const scrollVelocityRef = useRef<number>(0);
  const lastScrollTimeRef = useRef<number>(0);
  const currentPixelationRef = useRef<number>(0);
  const currentDistortionRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const isVisibleRef = useRef<boolean>(true);
  
  // 容器尺寸狀態
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ 
    width: 300, 
    height: 200 
  });
  const containerSizeRef = useRef<{ width: number; height: number }>({ width: 300, height: 200 });
  
  // 效果狀態（用於調試顯示）
  const [effectValues, setEffectValues] = useState({
    pixelation: 0,
    distortion: 0,
    scrollVelocity: 0
  });

  // 計算滾動速度
  const updateScrollVelocity = useCallback(() => {
    const currentTime = performance.now();
    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    const deltaTime = currentTime - lastScrollTimeRef.current;
    const deltaScroll = currentScrollY - scrollYRef.current;
    
    if (deltaTime > 0) {
      const rawVelocity = Math.abs(deltaScroll / deltaTime);
      scrollVelocityRef.current = rawVelocity * scrollSensitivity;
    }
    
    scrollYRef.current = currentScrollY;
    lastScrollTimeRef.current = currentTime;
  }, [scrollSensitivity]);

  // 滾動事件監聽
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateScrollVelocity();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    // 初始化滾動位置
    scrollYRef.current = window.pageYOffset || document.documentElement.scrollTop;
    lastScrollTimeRef.current = performance.now();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [updateScrollVelocity]);

  // 載入紋理
  const loadTexture = useCallback(async (url: string) => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    
    return new Promise<THREE.Texture>((resolve, reject) => {
      loader.load(
        url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.generateMipmaps = false;
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          resolve(texture);
        },
        undefined,
        (err) => reject(err)
      );
    });
  }, []);

  // 停止渲染循環
  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // 更新相機
  const updateCamera = useCallback((width: number, height: number) => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.updateProjectionMatrix();
  }, []);

  // 適應圖片到容器
  const fitPlaneToContainer = useCallback((imgW: number, imgH: number, viewW: number, viewH: number) => {
    if (!meshRef.current) return;

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

    meshRef.current.scale.set(targetW, targetH, 1);
  }, [objectFit]);

  // 設置 Three.js 場景
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
    // ★ 色彩與 tone mapping：明確指定
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.setClearColor(0x000000, 0);

    // scene & camera
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.1, 1000);
    camera.position.z = 1;

    // plane to hold image
    const geometry = new THREE.PlaneGeometry(1, 1);
    // ★ 建立自定義材質（直接使用 ShaderMaterial）
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: null },
        uPixelation: { value: 0 },
        uDistortion: { value: 0 },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
      },
      transparent: true,
      toneMapped: false, // ★ 關閉 tone mapping
    });
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // assign refs
    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    materialRef.current = material;
    meshRef.current = plane;

    updateCamera(width, height);
  }, [maxPixelRatio, updateCamera]);

  // 渲染循環
  const renderLoop = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rafRef.current = requestAnimationFrame(renderLoop);

    // 更新時間
    timeRef.current += 0.01;

    // 計算目標效果值
    const targetPixelation = Math.min(scrollVelocityRef.current * maxPixelation, maxPixelation);
    const targetDistortion = Math.min(scrollVelocityRef.current * maxDistortion, maxDistortion);

    // 平滑過渡到目標值
    currentPixelationRef.current = THREE.MathUtils.lerp(
      currentPixelationRef.current,
      targetPixelation,
      1 - decaySpeed
    );
    currentDistortionRef.current = THREE.MathUtils.lerp(
      currentDistortionRef.current,
      targetDistortion,
      1 - decaySpeed
    );

    // 更新著色器 uniforms
    if (materialRef.current) {
      materialRef.current.uniforms.uPixelation.value = currentPixelationRef.current;
      materialRef.current.uniforms.uDistortion.value = currentDistortionRef.current;
      materialRef.current.uniforms.uTime.value = timeRef.current;
    }

    // 更新調試信息
    if (debug) {
      setEffectValues({
        pixelation: Math.round(currentPixelationRef.current * 10) / 10,
        distortion: Math.round(currentDistortionRef.current * 100) / 100,
        scrollVelocity: Math.round(scrollVelocityRef.current * 100) / 100
      });
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);

    // 自然衰減滾動速度
    scrollVelocityRef.current *= decaySpeed;
    if (scrollVelocityRef.current < 0.001) {
      scrollVelocityRef.current = 0;
    }
  }, [maxPixelation, maxDistortion, decaySpeed, debug]);

  // 清理資源
  const disposeThree = useCallback(() => {
    stopLoop();

    if (meshRef.current && sceneRef.current) {
      sceneRef.current.remove(meshRef.current);
      meshRef.current.geometry.dispose();
    }

    if (materialRef.current) {
      materialRef.current.dispose();
    }

    if (textureRef.current) {
      textureRef.current.dispose();
    }

    if (rendererRef.current) {
      rendererRef.current.dispose();
    }

    // 清除引用
    rendererRef.current = null;
    sceneRef.current = null;
    cameraRef.current = null;
    materialRef.current = null;
    meshRef.current = null;
    textureRef.current = null;
  }, [stopLoop]);

  // 應用紋理到平面
  const applyTextureToPlane = useCallback((tex: THREE.Texture) => {
    if (!materialRef.current) return;

    // 設置紋理到 shader material
    materialRef.current.uniforms.uTexture.value = tex;
    materialRef.current.needsUpdate = true;

    const img = tex.image as HTMLImageElement | { width: number; height: number };
    const w = img.width;
    const h = img.height;
    fitPlaneToContainer(w, h, containerSize.width, containerSize.height);
  }, [containerSize.width, containerSize.height, fitPlaneToContainer]);

  // 處理容器尺寸變化
  const handleResize = useCallback((width: number, height: number) => {
    setContainerSize({ width, height });
    containerSizeRef.current = { width, height };
    
    if (!rendererRef.current) return;
    
    rendererRef.current.setSize(width, height);
    updateCamera(width, height);

    // 更新著色器解析度
    if (materialRef.current) {
      materialRef.current.uniforms.uResolution.value.set(width, height);
    }

    // 依照新尺寸重新配適圖片平面
    if (textureRef.current) {
      const img = textureRef.current.image as HTMLImageElement | { width: number; height: number };
      fitPlaneToContainer(img.width, img.height, width, height);
    }
  }, [fitPlaneToContainer, updateCamera]);

  // 初始化和清理
  useEffect(() => {
    const container = (ref as React.RefObject<HTMLDivElement>)?.current || containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const initialWidth = Math.max(1, Math.round(rect.width));
    const initialHeight = Math.max(1, Math.round(rect.height));
    
    setContainerSize({ width: initialWidth, height: initialHeight });
    containerSizeRef.current = { width: initialWidth, height: initialHeight };
    setupThree(initialWidth, initialHeight);

    // 載入並設置紋理
    let mounted = true;
    (async () => {
      try {
        const texture = await loadTexture(src);
        if (!mounted) return;
        
        textureRef.current = texture;
        applyTextureToPlane(texture);
        
        if (onLoad) onLoad();
        
        // 開始渲染循環
        rafRef.current = requestAnimationFrame(renderLoop);
        
      } catch (error) {
        if (onError) onError(error);
        // 若失敗仍啟動渲染迴圈，以保持透明背景
        if (rafRef.current == null && isVisibleRef.current) renderLoop();
      }
    })();

    // ResizeObserver 監聽容器尺寸
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      handleResize(Math.max(1, Math.round(width)), Math.max(1, Math.round(height)));
    });
    resizeObserver.observe(container);

    // IntersectionObserver 控制渲染循環節省資源
    const intersectionObserver = new IntersectionObserver((entries) => {
      const entry = entries[0];
      const visible = entry.isIntersecting && entry.intersectionRatio > 0;
      isVisibleRef.current = visible;
      if (visible) {
        if (rafRef.current == null) renderLoop();
      } else {
        stopLoop();
      }
    }, { threshold: [0, 0.01] });
    intersectionObserver.observe(container);

    // 頁面可見性變化
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopLoop();
      } else if (isVisibleRef.current && rafRef.current == null) {
        renderLoop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      disposeThree();
    };
  }, [src, setupThree, loadTexture, applyTextureToPlane, onLoad, onError, renderLoop, handleResize, disposeThree, ref, stopLoop]);

  // 當 objectFit 改變時重新配適圖片平面
  useEffect(() => {
    if (!textureRef.current) return;
    const img = textureRef.current.image as HTMLImageElement | { width: number; height: number };
    fitPlaneToContainer(img.width, img.height, containerSize.width, containerSize.height);
  }, [objectFit, containerSize.width, containerSize.height, fitPlaneToContainer]);

  // 當 maxPixelRatio 在執行期改變時，安全地更新 renderer DPR 與尺寸
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const safeMaxPR = Number.isFinite(maxPixelRatio as number)
      ? Math.max(0.1, maxPixelRatio as number)
      : 1.5;
    const ratio = Math.min(window.devicePixelRatio || 1, safeMaxPR);
    renderer.setPixelRatio(ratio);
    const { width, height } = containerSizeRef.current;
    renderer.setSize(width, height, false);
    if (rafRef.current == null && isVisibleRef.current) {
      renderLoop();
    }
  }, [maxPixelRatio, renderLoop]);

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        if (ref) {
          if (typeof ref === 'function') ref(node);
          else ref.current = node;
        }
      }}
      className={`distorted-pixels ${className}`.trim()}
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'block'
        }}
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
    </div>
  );
});

DistortedPixels.displayName = 'DistortedPixels';

export { DistortedPixels };
export default DistortedPixels;