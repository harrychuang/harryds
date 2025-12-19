// =============================================================================
// SCREEN SAVER CONTEXT - 螢幕保護程式狀態管理
// =============================================================================
// - 閒置 1 分鐘自動啟動
// - Konami Code 彩蛋 (↑↑↓↓←→←→BA)
// =============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface ScreenSaverContextType {
  /** 是否顯示螢幕保護程式 */
  isActive: boolean;
  /** 啟動螢幕保護程式 */
  activate: () => void;
  /** 關閉螢幕保護程式 */
  deactivate: () => void;
  /** 是否正在顯示 Konami Code 錯誤動畫 */
  isShowingError: boolean;
}

const ScreenSaverContext = createContext<ScreenSaverContextType | undefined>(undefined);

// Konami Code 序列
const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

// 閒置時間（毫秒）
const IDLE_TIMEOUT = 180 * 1000; // 3 分鐘

interface ScreenSaverProviderProps {
  children: React.ReactNode;
}

export const ScreenSaverProvider: React.FC<ScreenSaverProviderProps> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [isShowingError, setIsShowingError] = useState(false);
  
  // Refs
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const konamiIndexRef = useRef(0);
  const konamiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 啟動螢幕保護程式
  const activate = useCallback(() => {
    setIsActive(true);
  }, []);

  // 關閉螢幕保護程式
  const deactivate = useCallback(() => {
    setIsActive(false);
    setIsShowingError(false);
  }, []);

  // 重置閒置計時器
  const resetIdleTimer = useCallback(() => {
    // 如果螢幕保護程式已啟動，不重置計時器
    if (isActive) return;

    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    idleTimerRef.current = setTimeout(() => {
      activate();
    }, IDLE_TIMEOUT);
  }, [isActive, activate]);

  // 處理 Konami Code 輸入（從 PocketConsole 觸發）
  const handleKonamiFromConsole = useCallback(() => {
    // 先顯示錯誤，然後啟動螢幕保護程式
    setIsShowingError(true);
    setTimeout(() => {
      setIsShowingError(false);
      activate();
    }, 1200); // 與 PocketConsole 的錯誤動畫時間一致
  }, [activate]);

  // 處理鍵盤 Konami Code
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 如果螢幕保護程式已啟動，忽略
    if (isActive) return;

    // 如果正在輸入表單，忽略
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // 清除之前的超時
    if (konamiTimeoutRef.current) {
      clearTimeout(konamiTimeoutRef.current);
    }

    // 檢查當前按鍵是否匹配
    const expectedKey = KONAMI_CODE[konamiIndexRef.current];
    
    if (e.code === expectedKey) {
      konamiIndexRef.current++;

      // 如果完成了整個序列
      if (konamiIndexRef.current === KONAMI_CODE.length) {
        konamiIndexRef.current = 0;
        handleKonamiFromConsole();
      } else {
        // 設置超時重置（3 秒內必須完成）
        konamiTimeoutRef.current = setTimeout(() => {
          konamiIndexRef.current = 0;
        }, 3000);
      }
    } else {
      // 不匹配，重置
      konamiIndexRef.current = 0;
      
      // 檢查是否是序列的開始
      if (e.code === KONAMI_CODE[0]) {
        konamiIndexRef.current = 1;
        konamiTimeoutRef.current = setTimeout(() => {
          konamiIndexRef.current = 0;
        }, 3000);
      }
    }
  }, [isActive, handleKonamiFromConsole]);

  // 設置閒置監聽
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'wheel'];

    const handleActivity = () => {
      resetIdleTimer();
    };

    // 初始化計時器
    resetIdleTimer();

    // 添加事件監聽
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [resetIdleTimer]);

  // 設置鍵盤 Konami Code 監聽
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (konamiTimeoutRef.current) {
        clearTimeout(konamiTimeoutRef.current);
      }
    };
  }, [handleKeyDown]);

  // 當螢幕保護程式關閉時，重置閒置計時器
  useEffect(() => {
    if (!isActive) {
      resetIdleTimer();
    }
  }, [isActive, resetIdleTimer]);

  // 暴露 handleKonamiFromConsole 給 PocketConsole 使用
  // 通過 window 物件傳遞（避免 prop drilling）
  useEffect(() => {
    (window as any).__screenSaverKonamiTrigger = handleKonamiFromConsole;
    return () => {
      delete (window as any).__screenSaverKonamiTrigger;
    };
  }, [handleKonamiFromConsole]);

  return (
    <ScreenSaverContext.Provider value={{ isActive, activate, deactivate, isShowingError }}>
      {children}
    </ScreenSaverContext.Provider>
  );
};

export const useScreenSaver = (): ScreenSaverContextType => {
  const context = useContext(ScreenSaverContext);
  if (!context) {
    throw new Error('useScreenSaver must be used within a ScreenSaverProvider');
  }
  return context;
};
