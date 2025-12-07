import React, { useState, useEffect, useRef } from 'react';
import { PixelLoading } from 'hds';
import { usePageLoader } from '../contexts/PageLoaderContext';
import './PageLoader.scss';

interface PageLoaderProps {
  /** 是否正在載入 */
  isLoading: boolean;
  /** 進度值 (0-100)，可選 */
  progress?: number;
  /** 載入完成後的回調 */
  onComplete?: () => void;
  /** 自訂 labels */
  labels?: string[];
  /** mask 背景色 */
  backgroundColor?: string;
  /** 最小顯示時間 (ms) */
  minDisplayTime?: number;
}

const PageLoader: React.FC<PageLoaderProps> = ({
  isLoading,
  progress = 0,
  onComplete,
  labels = ['LOADING...', 'HARRY DESIGN STUDIO'],
  backgroundColor = '#111111',
  minDisplayTime = 1000,
}) => {
  const { setAnimationComplete } = usePageLoader();
  
  // 動畫階段: 'hidden' | 'entering' | 'visible' | 'exiting' | 'mask-closing'
  const [phase, setPhase] = useState<'hidden' | 'entering' | 'visible' | 'exiting' | 'mask-closing'>('hidden');
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  
  // 使用 ref 追蹤載入完成狀態，避免閉包問題
  const loadingFinishedRef = useRef(false);
  const minTimeElapsedRef = useRef(false);
  
  // 使用 ref 追蹤最新的 isLoading 狀態（用於在 setTimeout/rAF 中讀取）
  const isLoadingRef = useRef(isLoading);
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  // 當 isLoading 變為 true 時開始進入動畫
  // 但會延遲一幀，讓頁面組件（如 ErrorPage）有機會先設定 loading = false
  useEffect(() => {
    if (isLoading && phase === 'hidden') {
      // 使用 requestAnimationFrame 延遲，讓 useLayoutEffect 先執行
      const raf = requestAnimationFrame(() => {
        // 再次檢查：如果在這一幀後 isLoading 已經變成 false，就不要開始動畫
        if (!isLoadingRef.current) {
          setAnimationComplete(true);
          return;
        }
        
        setPhase('entering');
        setLoadStartTime(Date.now());
        loadingFinishedRef.current = false;
        minTimeElapsedRef.current = false;
        setSimulatedProgress(0);
        setAnimationComplete(false); // 重置動畫完成狀態
      });
      
      return () => cancelAnimationFrame(raf);
    }
  }, [isLoading, phase, setAnimationComplete]);

  // 進入動畫完成後變為 visible
  useEffect(() => {
    if (phase === 'entering') {
      const timer = setTimeout(() => {
        setPhase('visible');
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // 最小顯示時間計時
  useEffect(() => {
    if (phase === 'entering' || phase === 'visible') {
      const timer = setTimeout(() => {
        minTimeElapsedRef.current = true;
        
        // 如果載入已完成，開始退出
        if (loadingFinishedRef.current) {
          setPhase('exiting');
        }
      }, minDisplayTime);
      
      return () => clearTimeout(timer);
    }
  }, [phase, minDisplayTime]);

  // 監聽 isLoading 變化
  useEffect(() => {
    if (!isLoading && (phase === 'visible' || phase === 'entering')) {
      loadingFinishedRef.current = true;
      setSimulatedProgress(100);
      
      // 如果最小時間已過，立即開始退出
      if (minTimeElapsedRef.current) {
        setPhase('exiting');
      }
    }
  }, [isLoading, phase]);

  // 退出動畫：loading 往下移動後，開始關閉 mask
  useEffect(() => {
    if (phase === 'exiting') {
      const timer = setTimeout(() => {
        setPhase('mask-closing');
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // mask 關閉動畫完成後隱藏
  useEffect(() => {
    if (phase === 'mask-closing') {
      const timer = setTimeout(() => {
        setPhase('hidden');
        setLoadStartTime(null);
        loadingFinishedRef.current = false;
        minTimeElapsedRef.current = false;
        setAnimationComplete(true); // 標記動畫完成
        onComplete?.();
      }, 800); // mask 關閉動畫時間（含 delay）
      
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete, setAnimationComplete]);

  // 計算動態進度
  useEffect(() => {
    if ((phase === 'entering' || phase === 'visible') && loadStartTime && !loadingFinishedRef.current) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - loadStartTime;
        const simulated = Math.min(95, Math.floor(elapsed / 30));
        setSimulatedProgress(simulated);
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [phase, loadStartTime]);

  if (phase === 'hidden') {
    return null;
  }

  const displayProgress = progress > 0 ? progress : simulatedProgress;

  return (
    <div 
      className={`page-loader page-loader--${phase}`}
      style={{ '--loader-bg': backgroundColor } as React.CSSProperties}
    >
      <div className="page-loader__mask" />
      <div className="page-loader__content">
        <PixelLoading
          progress={displayProgress}
          pixelSize={3}
          pixelGap={1}
          binaryDigits={7}
          letterSpacing={2}
          animated={true}
          labels={labels}
          glitchInterval={1500}
          glitchCount={5}
          glitchSpeed={100}
          color="#ffffff"
        />
      </div>
    </div>
  );
};

export default PageLoader;
