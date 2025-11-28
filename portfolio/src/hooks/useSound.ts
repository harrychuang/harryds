// =============================================================================
// useSound Hook - 音效狀態管理
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { audioManager } from '../../../harryds/src/utils/audioManager';

/**
 * Hook 用於管理全局音效狀態
 * @returns {Object} 包含音效狀態和控制方法
 */
export const useSound = () => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(audioManager.isSoundEnabled);

  useEffect(() => {
    // 訂閱音效狀態變化
    const unsubscribe = audioManager.subscribe((enabled) => {
      setIsSoundEnabled(enabled);
    });

    return unsubscribe;
  }, []);

  const toggleSound = useCallback(() => {
    audioManager.toggleSound();
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    audioManager.setSoundEnabled(enabled);
  }, []);

  return {
    isSoundEnabled,
    toggleSound,
    setSoundEnabled,
  };
};

export default useSound;

