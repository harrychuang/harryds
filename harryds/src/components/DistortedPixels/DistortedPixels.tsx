// =============================================================================
// DISTORTED PIXELS 元件 - 響應滾動的扭曲像素化圖片
// 參考 akella/DistortedPixels，實現滾動加速時的垂直撕裂和像素化效果
// =============================================================================

import { useEffect, useRef, useState, useCallback, forwardRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export type DistortedPixelsObjectFit = 'cover' | 'contain' | 'fill' | 'responsive';

export interface DistortedPixelsProps {
  /** 圖片來源 URL */
  src: string;
  /** 尺寸配置：圖片如何填滿容器，responsive 模式會根據圖片比例自動調整容器高度 */
  objectFit?: DistortedPixelsObjectFit;
  /** 扭曲方向：'y' 垂直拉扯（預設）、'x' 水平拉扯 */
  direction?: 'x' | 'y';
  /** 最大像素化程度（數值越大像素塊越大，0-200） */
  maxPixelation?: number;
  /** 最大扭曲強度（0-1） */
  maxDistortion?: number;
  /** 滾動響應靈敏度（數值越大越敏感） */
  scrollSensitivity?: number;
  /** 效果衰減速度（數值越大衰減越快） */
  decaySpeed?: number;
  /** DPR 上限，避免行動裝置過高像素比造成負擔 */
  maxPixelRatio?: number;
  /** 自適應畫質：依效果強度動態降低後處理解析度 */
  adaptiveQuality?: boolean;
  /** 自適應畫質的最低比例（0.3-1.0） */
  minQualityScale?: number;
  /** 滾動容器元素引用，若未提供則監聽 window 滾動 */
  scrollContainer?: React.RefObject<HTMLElement> | HTMLElement | null;
  /** 額外 CSS 類名 */
  className?: string;
  /** 載入成功回呼 */
  onLoad?: () => void;
  /** 載入失敗回呼 */
  onError?: (error: unknown) => void;
  /** 是否啟用調試模式（顯示效果參數） */
  debug?: boolean;
  /** 當使用 responsive 模式時，容器高度變化的回呼 */
  onHeightChange?: (height: number) => void;
}

// 後處理扭曲著色器（適用於 ShaderPass，輸入 tDiffuse）
const DistortionShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'uPixelation': { value: 0 },
    'uDistortion': { value: 0 },
    'uTime': { value: 0 },
    'uResolution': { value: new THREE.Vector2() },
    'uDirection': { value: 0 }, // 0 = 垂直拉扯 (Y)，1 = 水平拉扯 (X)
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uPixelation;
    uniform float uDistortion;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uDirection; // 0 = Y (垂直)、1 = X (水平)
    varying vec2 vUv;
    
    // 雜湊函數 - 產生偽隨機值
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    void main() {
      vec2 uv = vUv;
      
      // 設定最小閾值，低於此值時保持原始清晰度
      float pixelationThreshold = 5.0;
      
      // 如果像素化和扭曲都很小，直接輸出原始圖片
      if (uPixelation < pixelationThreshold && uDistortion < 0.1) {
        gl_FragColor = texture2D(tDiffuse, uv);
        return;
      }
      
      // 計算實際使用的 UV 座標（根據效果強度決定）
      vec2 finalUV = uv;
      
      // 只在效果足夠強時才應用像素化和扭曲
      if (uPixelation >= pixelationThreshold || uDistortion >= 0.1) {
        const int TAPS = 9;
        if (uDirection < 0.5) {
          // 垂直扭曲：以欄為單位，沿 Y 軸拖影
          float columnWidth = max(0.01, uPixelation * 0.002);
          float columnIndex = floor(uv.x / columnWidth);
          float columnCenterX = (columnIndex + 0.5) * columnWidth;

          float colHash = hash(vec2(columnIndex * 0.07, 0.123));
          float timePhase = hash(vec2(columnIndex * 0.07, 3.14)) * 6.28318;
          float dir = sign(sin(uTime * 1.5 + timePhase));
          float smearLen = (0.02 + colHash * 0.04) * uDistortion;

          vec4 accum = vec4(0.0);
          float wsum = 0.0;
          for (int i = 0; i < TAPS; i++) {
            float t = float(i) / float(TAPS - 1);
            float centered = (t - 0.5) * 2.0;
            float bias = mix(centered, max(0.0, dir * centered), 0.6);
            float offset = bias * smearLen;
            vec2 suv = vec2(columnCenterX, clamp(uv.y + offset, 0.0, 1.0));
            if (uPixelation >= pixelationThreshold) {
              float pixelHeight = max(0.005, uPixelation * 0.0035);
              suv.y = (floor(suv.y / pixelHeight) + 0.5) * pixelHeight;
            }
            vec4 c = texture2D(tDiffuse, suv);
            float w = 1.0 - abs(centered);
            accum += c * w;
            wsum += w;
          }
          if (wsum > 0.0) {
            finalUV = vec2(columnCenterX, uv.y);
          }
          if (uPixelation >= pixelationThreshold) {
            finalUV.x = columnCenterX;
          }
        } else {
          // 水平扭曲：以列為單位，沿 X 軸拖影
          float rowHeight = max(0.01, uPixelation * 0.0035);
          float rowIndex = floor(uv.y / rowHeight);
          float rowCenterY = (rowIndex + 0.5) * rowHeight;

          float rowHash = hash(vec2(rowIndex * 0.07, 0.987));
          float timePhase = hash(vec2(rowIndex * 0.07, 6.28)) * 6.28318;
          float dir = sign(sin(uTime * 1.5 + timePhase));
          float smearLen = (0.02 + rowHash * 0.04) * uDistortion;

          vec4 accum = vec4(0.0);
          float wsum = 0.0;
          for (int i = 0; i < TAPS; i++) {
            float t = float(i) / float(TAPS - 1);
            float centered = (t - 0.5) * 2.0;
            float bias = mix(centered, max(0.0, dir * centered), 0.6);
            float offset = bias * smearLen;
            vec2 suv = vec2(clamp(uv.x + offset, 0.0, 1.0), rowCenterY);
            if (uPixelation >= pixelationThreshold) {
              float pixelWidth = max(0.01, uPixelation * 0.002);
              suv.x = (floor(suv.x / pixelWidth) + 0.5) * pixelWidth;
            }
            vec4 c = texture2D(tDiffuse, suv);
            float w = 1.0 - abs(centered);
            accum += c * w;
            wsum += w;
          }
          if (wsum > 0.0) {
            finalUV = vec2(uv.x, rowCenterY);
          }
          if (uPixelation >= pixelationThreshold) {
            finalUV.y = rowCenterY;
          }
        }
      }
      
      // 採樣紋理
      vec4 color = texture2D(tDiffuse, finalUV);
      
      // 只在扭曲足夠強時添加數位化雜訊效果
      if (uDistortion > 0.2) {
        float digitalNoise = step(0.95, hash(floor(uv * 200.0)));
        color.rgb = mix(color.rgb, vec3(1.0), digitalNoise * uDistortion * 0.1);
      }
      
      // 只在像素化足夠強時為像素邊緣添加對比度（依方向）
      if (uPixelation > 20.0) {
        if (uDirection < 0.5) {
          float columnWidth = max(0.01, uPixelation * 0.002);
          float pixelBoundary = abs(fract(uv.x / columnWidth) - 0.5);
          float verticalEdge = 1.0 - smoothstep(0.4, 0.5, pixelBoundary);
          color.rgb *= (1.0 + verticalEdge * 0.15);
        } else {
          float rowHeight = max(0.01, uPixelation * 0.0035);
          float rowBoundary = abs(fract(uv.y / rowHeight) - 0.5);
          float horizontalEdge = 1.0 - smoothstep(0.4, 0.5, rowBoundary);
          color.rgb *= (1.0 + horizontalEdge * 0.15);
        }
      }
      
      gl_FragColor = color;
    }
  `,
};

const DistortedPixels = forwardRef<HTMLDivElement, DistortedPixelsProps>(({ 
  src,
  objectFit = 'cover',
  direction = 'x',
  maxPixelation = 150,
  maxDistortion = 0,
  scrollSensitivity = 0.1,
  decaySpeed = 0.95,
  maxPixelRatio = 4,
  adaptiveQuality = true,
  minQualityScale = 0.6,
  scrollContainer,
  className = '',
  onLoad,
  onError,
  onHeightChange,
  debug = false,
}, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Three.js 引用
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const renderPassRef = useRef<RenderPass | null>(null);
  const distortionPassRef = useRef<ShaderPass | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const meshRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const basePixelRatioRef = useRef<number>(1);
  const currentQualityScaleRef = useRef<number>(1);
  
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
  
  // responsive 模式下的自動計算高度
  const [responsiveHeight, setResponsiveHeight] = useState<number | null>(null);
  
  // 效果狀態（用於調試顯示）
  const [effectValues, setEffectValues] = useState({
    pixelation: 0,
    distortion: 0,
    scrollVelocity: 0
  });

  // 計算滾動速度
  const updateScrollVelocity = useCallback(() => {
    const currentTime = performance.now();
    
    // 根據是否有指定 scrollContainer 來決定監聽的滾動元素
    let currentScrollY: number;
    if (scrollContainer) {
      const container = scrollContainer instanceof HTMLElement 
        ? scrollContainer 
        : scrollContainer.current;
      currentScrollY = container ? container.scrollTop : 0;
    } else {
      currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
    }
    
    const deltaTime = currentTime - lastScrollTimeRef.current;
    const deltaScroll = currentScrollY - scrollYRef.current;
    
    if (deltaTime > 0) {
      const rawVelocity = Math.abs(deltaScroll / deltaTime);
      scrollVelocityRef.current = rawVelocity * scrollSensitivity;
    }
    
    scrollYRef.current = currentScrollY;
    lastScrollTimeRef.current = currentTime;
    // 滾動時喚醒渲染（若已暫停）
    if (rafRef.current == null && isVisibleRef.current) {
      rafRef.current = requestAnimationFrame(renderLoop);
    }
  }, [scrollSensitivity, scrollContainer]);

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
    
    // 決定監聽的元素
    let scrollElement: HTMLElement | Window = window;
    if (scrollContainer) {
      const container = scrollContainer instanceof HTMLElement 
        ? scrollContainer 
        : scrollContainer.current;
      if (container) {
        scrollElement = container;
      }
    }
    
    // 初始化滾動位置
    if (scrollElement === window) {
      scrollYRef.current = window.pageYOffset || document.documentElement.scrollTop;
    } else {
      scrollYRef.current = (scrollElement as HTMLElement).scrollTop;
    }
    lastScrollTimeRef.current = performance.now();
    
    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [updateScrollVelocity, scrollContainer]);

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
    } else if (objectFit === 'responsive') {
      // responsive 模式：寬度 100%，高度根據圖片比例自動計算
      targetW = viewW;
      targetH = viewW / imageAspect;
      
      // 更新 responsive 高度狀態
      setResponsiveHeight(targetH);
      
      // 通知父組件容器高度變化
      if (onHeightChange) {
        onHeightChange(targetH);
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
  }, [objectFit, onHeightChange]);

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
    basePixelRatioRef.current = renderer.getPixelRatio();
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
    // ★ 使用 MeshBasicMaterial 並關閉 tone mapping
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, toneMapped: false });
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // 後處理鏈：RenderPass -> DistortionPass -> OutputPass
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    const distortionPass = new ShaderPass(DistortionShader);
    distortionPass.uniforms['uResolution'].value.set(width, height);
    composer.addPass(distortionPass);
    currentQualityScaleRef.current = 1;
    composer.addPass(new OutputPass());

    // assign refs
    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    composerRef.current = composer;
    renderPassRef.current = renderPass;
    distortionPassRef.current = distortionPass;
    materialRef.current = material;
    meshRef.current = plane;

    updateCamera(width, height);
  }, [maxPixelRatio, updateCamera]);

  // 渲染循環
  const renderLoop = useCallback(() => {
    if (!rendererRef.current || !composerRef.current) return;
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

    // 更新後處理著色器 uniforms
    if (distortionPassRef.current) {
      distortionPassRef.current.uniforms['uPixelation'].value = currentPixelationRef.current;
      distortionPassRef.current.uniforms['uDistortion'].value = currentDistortionRef.current;
      distortionPassRef.current.uniforms['uTime'].value = timeRef.current;
      distortionPassRef.current.uniforms['uDirection'].value = direction === 'x' ? 1.0 : 0.0;
    }

    // 自適應畫質：根據強度降低後處理輸出解析度（僅 composer 層級，避免換算 renderer DPR）
    if (adaptiveQuality && composerRef.current) {
      const basePR = basePixelRatioRef.current;
      const minScale = Math.min(1, Math.max(0.3, minQualityScale));
      const p = maxPixelation > 0 ? currentPixelationRef.current / Math.max(1e-6, maxPixelation) : 0;
      const d = maxDistortion > 0 ? currentDistortionRef.current / Math.max(1e-6, maxDistortion) : 0;
      const intensity = Math.min(1, Math.max(p, d));
      const targetScale = THREE.MathUtils.lerp(1, minScale, intensity);
      if (Math.abs(targetScale - currentQualityScaleRef.current) > 0.05) {
        const pr = basePR * targetScale;
        composerRef.current.setPixelRatio(pr);
        currentQualityScaleRef.current = targetScale;
      }
    }

    // 更新調試信息
    if (debug) {
      setEffectValues({
        pixelation: Math.round(currentPixelationRef.current * 10) / 10,
        distortion: Math.round(currentDistortionRef.current * 100) / 100,
        scrollVelocity: Math.round(scrollVelocityRef.current * 100) / 100
      });
    }

    composerRef.current.render();

    // 自然衰減滾動速度
    scrollVelocityRef.current *= decaySpeed;
    if (scrollVelocityRef.current < 0.001) {
      scrollVelocityRef.current = 0;
    }
    // 若已無效果與滾動，且非 debug，暫停渲染等待喚醒
    if (!debug && currentPixelationRef.current < 0.01 && currentDistortionRef.current < 0.01 && scrollVelocityRef.current === 0) {
      stopLoop();
    }
  }, [maxPixelation, maxDistortion, decaySpeed, debug, direction, adaptiveQuality, minQualityScale]);

  // 清理資源
  const disposeThree = useCallback(() => {
    stopLoop();

    if (composerRef.current) {
      composerRef.current.dispose();
      composerRef.current = null;
    }

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
    renderPassRef.current = null;
    distortionPassRef.current = null;
  }, [stopLoop]);

  // 應用紋理到平面
  const applyTextureToPlane = useCallback((tex: THREE.Texture) => {
    if (!materialRef.current) return;

    // 設置紋理到 MeshBasicMaterial
    materialRef.current.map = tex;
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
    if (composerRef.current) {
      composerRef.current.setSize(width, height);
    }
    updateCamera(width, height);

    // 更新著色器解析度
    if (distortionPassRef.current) {
      distortionPassRef.current.uniforms['uResolution'].value.set(width, height);
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

  // 處理 responsive 模式下的高度變化
  useEffect(() => {
    if (objectFit === 'responsive' && responsiveHeight) {
      const currentHeight = containerSize.height;
      const newHeight = responsiveHeight;
      
      // 如果高度有顯著變化，更新 Three.js 場景尺寸
      if (Math.abs(newHeight - currentHeight) > 1) {
        handleResize(containerSize.width, newHeight);
        setContainerSize(prev => ({ ...prev, height: newHeight }));
        containerSizeRef.current = { width: containerSize.width, height: newHeight };
      }
    }
  }, [responsiveHeight, objectFit, handleResize, containerSize.width, containerSize.height]);

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
        height: objectFit === 'responsive' && responsiveHeight 
          ? `${responsiveHeight}px` 
          : '100%', 
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