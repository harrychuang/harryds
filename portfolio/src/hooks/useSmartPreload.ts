import { useRef, useCallback, useEffect } from 'react';

interface PreloadConfig {
  /** Hover 延遲多久後開始預載 (ms) */
  hoverDelay?: number;
  /** 預載超時時間 (ms) */
  timeout?: number;
  /** 是否啟用預載 */
  enabled?: boolean;
  /** 最大同時預載數量 */
  maxConcurrent?: number;
}

interface PreloadItem {
  id: number;
  promise: Promise<void>;
  abortController: AbortController;
  startTime: number;
}

const DEFAULT_CONFIG: Required<PreloadConfig> = {
  hoverDelay: 300,      // 300ms 後才開始預載，避免誤觸發
  timeout: 5000,        // 5秒超時
  enabled: true,
  maxConcurrent: 2,     // 同時最多預載 2 個
};

/**
 * 智能預載 Hook
 * 
 * 特色：
 * - 延遲預載：hover 300ms 後才開始，避免誤觸發
 * - 可取消：移出 hover 時立即取消請求
 * - 頻寬友好：限制同時預載數量
 * - 智能快取：避免重複預載
 * - 性能監控：追蹤預載效果
 */
export const useSmartPreload = (config: PreloadConfig = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const preloadedIds = useRef(new Set<number>());
  const activePreloads = useRef(new Map<number, PreloadItem>());
  const hoverTimers = useRef(new Map<number, number>());
  const preloadQueue = useRef<number[]>([]);
  
  // 性能統計
  const stats = useRef({
    preloadCount: 0,
    cacheHits: 0,
    cancelledCount: 0,
    avgPreloadTime: 0,
  });

  // 清理函數
  const cleanup = useCallback(() => {
    // 清理所有計時器
    hoverTimers.current.forEach(timer => clearTimeout(timer));
    hoverTimers.current.clear();
    
    // 取消所有進行中的預載
    activePreloads.current.forEach(item => {
      item.abortController.abort();
    });
    activePreloads.current.clear();
    preloadQueue.current = [];
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // 執行預載的核心函數
  const executePreload = useCallback(async (id: number): Promise<void> => {
    if (!finalConfig.enabled || preloadedIds.current.has(id)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const abortController = new AbortController();
      const startTime = performance.now();
      
      // 模擬預載邏輯（實際應用中這裡會是 API 請求）
      const preloadPromise = new Promise<void>((preloadResolve, preloadReject) => {
        const timeoutId = setTimeout(() => {
          if (!abortController.signal.aborted) {
            // 標記為已預載
            preloadedIds.current.add(id);
            stats.current.preloadCount++;
            stats.current.avgPreloadTime = 
              (stats.current.avgPreloadTime * (stats.current.preloadCount - 1) + 
               (performance.now() - startTime)) / stats.current.preloadCount;
            
            preloadResolve();
          }
        }, 100); // 模擬很快的預載時間
        
        abortController.signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          stats.current.cancelledCount++;
          preloadReject(new Error('Preload cancelled'));
        });
      });

      const preloadItem: PreloadItem = {
        id,
        promise: preloadPromise,
        abortController,
        startTime,
      };

      activePreloads.current.set(id, preloadItem);

      preloadPromise
        .then(() => {
          activePreloads.current.delete(id);
          processQueue();
          resolve();
        })
        .catch((error) => {
          activePreloads.current.delete(id);
          processQueue();
          reject(error);
        });

      // 超時處理
      setTimeout(() => {
        if (activePreloads.current.has(id)) {
          abortController.abort();
        }
      }, finalConfig.timeout);
    });
  }, [finalConfig.enabled, finalConfig.timeout]);

  // 處理預載隊列
  const processQueue = useCallback(() => {
    if (activePreloads.current.size >= finalConfig.maxConcurrent) {
      return;
    }

    const nextId = preloadQueue.current.shift();
    if (nextId !== undefined) {
      executePreload(nextId).catch(() => {}); // 忽略錯誤
    }
  }, [finalConfig.maxConcurrent, executePreload]);

  // 開始預載
  const startPreload = useCallback((id: number) => {
    if (!finalConfig.enabled || preloadedIds.current.has(id)) {
      return;
    }

    if (activePreloads.current.size < finalConfig.maxConcurrent) {
      executePreload(id).catch(() => {});
    } else {
      // 加入隊列等待
      if (!preloadQueue.current.includes(id)) {
        preloadQueue.current.push(id);
      }
    }
  }, [finalConfig.enabled, finalConfig.maxConcurrent, executePreload]);

  // Hover 開始
  const onHoverStart = useCallback((id: number) => {
    if (!finalConfig.enabled) return;

    // 清除之前的計時器
    const existingTimer = hoverTimers.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // 設置延遲預載
    const timer = window.setTimeout(() => {
      startPreload(id);
      hoverTimers.current.delete(id);
    }, finalConfig.hoverDelay);

    hoverTimers.current.set(id, timer);
  }, [finalConfig.enabled, finalConfig.hoverDelay, startPreload]);

  // Hover 結束
  const onHoverEnd = useCallback((id: number) => {
    // 取消計時器
    const timer = hoverTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      hoverTimers.current.delete(id);
    }

    // 取消進行中的預載
    const preloadItem = activePreloads.current.get(id);
    if (preloadItem) {
      preloadItem.abortController.abort();
    }

    // 從隊列移除
    const queueIndex = preloadQueue.current.indexOf(id);
    if (queueIndex > -1) {
      preloadQueue.current.splice(queueIndex, 1);
    }
  }, []);

  // 檢查是否已預載
  const isPreloaded = useCallback((id: number) => {
    return preloadedIds.current.has(id);
  }, []);

  // 手動清除快取
  const clearCache = useCallback((id?: number) => {
    if (id) {
      preloadedIds.current.delete(id);
    } else {
      preloadedIds.current.clear();
    }
  }, []);

  // 獲取統計數據
  const getStats = useCallback(() => ({
    ...stats.current,
    activeCount: activePreloads.current.size,
    queueLength: preloadQueue.current.length,
    cacheSize: preloadedIds.current.size,
    hitRate: stats.current.preloadCount > 0 
      ? (stats.current.cacheHits / stats.current.preloadCount * 100).toFixed(2) + '%'
      : '0%'
  }), []);

  return {
    onHoverStart,
    onHoverEnd,
    isPreloaded,
    clearCache,
    getStats,
    cleanup,
  };
};

// 用於性能調試的 Hook
export const usePreloadDebug = () => {
  const debugEnabled = useRef(process.env.NODE_ENV === 'development');
  
  const log = useCallback((message: string, data?: any) => {
    if (debugEnabled.current) {
      console.log(`[SmartPreload] ${message}`, data || '');
    }
  }, []);

  return { log };
};
