// =============================================================================
// Pixelation Manager - 單例渲染管理器
// 統一管理所有 PixelationImg 元件的動畫和渲染，優化多元件效能
// =============================================================================

export interface PixelationInstance {
  id: string;
  canvas: HTMLCanvasElement;
  image: HTMLImageElement | null;
  container: HTMLElement;
  currentPixelSize: number;
  targetPixelSize: number;
  basePixelSize: number;
  isAnimating: boolean;
  animationStartTime: number;
  animationFrom: number;
  animationTo: number;
  animationDuration: number;
  isVisible: boolean;
  isHovered: boolean;
  objectFit: 'cover' | 'contain' | 'fill';
  maxPixelRatio: number;
  desaturate: boolean;
  onRenderComplete?: () => void;
}

class PixelationManager {
  private static instance: PixelationManager | null = null;
  private instances: Map<string, PixelationInstance> = new Map();
  private rafId: number | null = null;
  private isRunning: boolean = false;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private lastFrameTime: number = 0;
  private targetFPS: number = 60;
  private frameInterval: number = 1000 / 60;

  private constructor() {
    // 創建共享的離屏 canvas
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { 
      willReadFrequently: false 
    });
  }

  public static getInstance(): PixelationManager {
    if (!PixelationManager.instance) {
      PixelationManager.instance = new PixelationManager();
    }
    return PixelationManager.instance;
  }

  // 註冊元件實例
  public register(instance: PixelationInstance): void {
    this.instances.set(instance.id, instance);
    this.startLoop();
  }

  // 取消註冊元件實例
  public unregister(id: string): void {
    this.instances.delete(id);
    if (this.instances.size === 0) {
      this.stopLoop();
    }
  }

  // 更新實例屬性
  public updateInstance(id: string, updates: Partial<PixelationInstance>): void {
    const instance = this.instances.get(id);
    if (instance) {
      Object.assign(instance, updates);
    }
  }

  // 取得實例
  public getInstance(id: string): PixelationInstance | undefined {
    return this.instances.get(id);
  }

  // 開始動畫
  public startAnimation(
    id: string, 
    toPixelSize: number, 
    duration: number = 500
  ): void {
    const instance = this.instances.get(id);
    if (!instance) return;

    instance.animationFrom = instance.currentPixelSize;
    instance.animationTo = toPixelSize;
    instance.animationStartTime = performance.now();
    instance.animationDuration = Math.max(1, duration);
    instance.isAnimating = true;
    instance.targetPixelSize = toPixelSize;

    this.startLoop();
  }

  // 立即渲染特定實例
  public renderInstance(id: string): void {
    const instance = this.instances.get(id);
    if (instance && instance.isVisible) {
      this.drawInstance(instance);
    }
  }

  // 標記可見性
  public setVisible(id: string, visible: boolean): void {
    const instance = this.instances.get(id);
    if (instance) {
      instance.isVisible = visible;
      if (visible) {
        // 可見時立即渲染一幀
        this.drawInstance(instance);
        this.startLoop();
      }
    }
  }

  // 開始渲染循環
  private startLoop(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  // 停止渲染循環
  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isRunning = false;
  }

  // 主渲染循環
  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    // 節流控制
    const elapsed = currentTime - this.lastFrameTime;
    if (elapsed < this.frameInterval) {
      this.rafId = requestAnimationFrame(this.loop);
      return;
    }
    this.lastFrameTime = currentTime - (elapsed % this.frameInterval);

    let hasActiveAnimations = false;
    let hasVisibleInstances = false;

    // 批量處理所有實例
    this.instances.forEach((instance) => {
      if (!instance.isVisible) return;
      hasVisibleInstances = true;

      // 處理動畫
      if (instance.isAnimating) {
        hasActiveAnimations = true;
        const progress = Math.min(
          1,
          (currentTime - instance.animationStartTime) / instance.animationDuration
        );

        // easeOutCubic 緩動
        const eased = 1 - Math.pow(1 - progress, 3);
        instance.currentPixelSize =
          instance.animationFrom +
          (instance.animationTo - instance.animationFrom) * eased;

        if (progress >= 1) {
          instance.isAnimating = false;
          instance.currentPixelSize = instance.animationTo;
        }

        this.drawInstance(instance);
      }
    });

    // 如果沒有活動動畫且沒有可見實例，停止循環
    if (!hasActiveAnimations && !hasVisibleInstances) {
      this.stopLoop();
    } else if (hasActiveAnimations) {
      this.rafId = requestAnimationFrame(this.loop);
    } else {
      // 有可見實例但沒有動畫，降低更新頻率
      this.stopLoop();
    }
  };

  // 繪製單個實例
  private drawInstance(instance: PixelationInstance): void {
    const { canvas, image, container, objectFit, maxPixelRatio, desaturate, isHovered } = instance;
    
    if (!image || !canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    if (width <= 0 || height <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
    const expectedWidth = Math.round(width * dpr);
    const expectedHeight = Math.round(height * dpr);

    // 只在尺寸變化時重設 canvas 尺寸
    if (canvas.width !== expectedWidth || canvas.height !== expectedHeight) {
      canvas.width = expectedWidth;
      canvas.height = expectedHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    // 計算圖片佈局
    const layout = this.calculateImageLayout(
      image.width,
      image.height,
      width,
      height,
      objectFit
    );

    if (layout.targetW <= 0 || layout.targetH <= 0) return;

    // 計算有效像素大小
    const effectivePixel = this.computeEffectivePixel(
      instance.currentPixelSize,
      width,
      height
    );

    // 使用離屏 canvas 進行像素化處理
    const offCanvas = this.offscreenCanvas!;
    const offCtx = this.offscreenCtx!;

    const blocksX = Math.max(1, Math.floor(layout.targetW / Math.max(1, effectivePixel)));
    const blocksY = Math.max(1, Math.floor(layout.targetH / Math.max(1, effectivePixel)));

    // 調整離屏 canvas 大小
    if (offCanvas.width !== blocksX || offCanvas.height !== blocksY) {
      offCanvas.width = blocksX;
      offCanvas.height = blocksY;
    }

    offCtx.imageSmoothingEnabled = false;
    offCtx.clearRect(0, 0, blocksX, blocksY);

    // 將原圖縮小繪製到離屏（取樣）
    offCtx.drawImage(image, 0, 0, blocksX, blocksY);

    // 重置主 canvas 變換
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;

    // 清除 canvas
    ctx.clearRect(0, 0, width, height);

    // 處理去彩效果
    const shouldDesaturate = desaturate && !isHovered;
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

    // 觸發渲染完成回調
    if (instance.onRenderComplete) {
      instance.onRenderComplete();
    }
  }

  // 計算圖片佈局
  private calculateImageLayout(
    imgW: number,
    imgH: number,
    viewW: number,
    viewH: number,
    objectFit: 'cover' | 'contain' | 'fill'
  ): { targetW: number; targetH: number; offsetX: number; offsetY: number } {
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
  }

  // 計算有效像素大小（避免過大的像素導致取樣過小）
  private computeEffectivePixel(base: number, width: number, height: number): number {
    const aw = Math.max(1, Math.floor(width));
    const ah = Math.max(1, Math.floor(height));
    const maxByW = Math.max(1, Math.floor(aw / 2));
    const maxByH = Math.max(1, Math.floor(ah / 2));
    return Math.max(1, Math.min(Math.floor(base), maxByW, maxByH));
  }

  // 設置目標 FPS
  public setTargetFPS(fps: number): void {
    this.targetFPS = Math.max(1, Math.min(120, fps));
    this.frameInterval = 1000 / this.targetFPS;
  }

  // 取得當前活動實例數量
  public getActiveCount(): number {
    return this.instances.size;
  }

  // 取得可見實例數量
  public getVisibleCount(): number {
    let count = 0;
    this.instances.forEach((instance) => {
      if (instance.isVisible) count++;
    });
    return count;
  }
}

export default PixelationManager;

