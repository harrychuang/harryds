import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';

type OverlayAnimationPhase = 'closed' | 'loading' | 'positioning' | 'expanding' | 'ready';

interface OverlayContextType {
  openCardId: number | null;
  setOpenCardId: (id: number | null) => void;
  animationPhase: OverlayAnimationPhase;
  setAnimationPhase: (phase: OverlayAnimationPhase) => void;
  overlayScrollRef: React.MutableRefObject<HTMLDivElement | null>;
  // 8-bit 轉場動畫狀態
  isTransitioning: boolean;
  setIsTransitioning: (transitioning: boolean) => void;
  transitionClickPosition: { x: number; y: number } | null;
  setTransitionClickPosition: (position: { x: number; y: number } | null) => void;
  transitionColor: string;
  setTransitionColor: (color: string) => void;
  // 控制轉場動畫是否應該開始消失（內容載入完成後才消失）
  shouldStartDisappear: boolean;
  setShouldStartDisappear: (should: boolean) => void;
}

const OverlayContext = createContext<OverlayContextType>({
  openCardId: null,
  setOpenCardId: () => {},
  animationPhase: 'closed',
  setAnimationPhase: () => {},
  overlayScrollRef: { current: null },
  isTransitioning: false,
  setIsTransitioning: () => {},
  transitionClickPosition: null,
  setTransitionClickPosition: () => {},
  transitionColor: '#000000',
  setTransitionColor: () => {},
  shouldStartDisappear: false,
  setShouldStartDisappear: () => {},
});

interface OverlayProviderProps {
  children: ReactNode;
}

export const OverlayProvider: React.FC<OverlayProviderProps> = ({ children }) => {
  const [openCardId, setOpenCardId] = useState<number | null>(null);
  const [animationPhase, setAnimationPhase] = useState<OverlayAnimationPhase>('closed');
  const overlayScrollRef = useRef<HTMLDivElement | null>(null);
  
  // 8-bit 轉場動畫狀態
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionClickPosition, setTransitionClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [transitionColor, setTransitionColor] = useState('#000000');
  const [shouldStartDisappear, setShouldStartDisappear] = useState(false);

  return (
    <OverlayContext.Provider value={{
      openCardId,
      setOpenCardId,
      animationPhase,
      setAnimationPhase,
      overlayScrollRef,
      isTransitioning,
      setIsTransitioning,
      transitionClickPosition,
      setTransitionClickPosition,
      transitionColor,
      setTransitionColor,
      shouldStartDisappear,
      setShouldStartDisappear,
    }}>
      {children}
    </OverlayContext.Provider>
  );
};

export const useOverlay = () => {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error('useOverlay must be used within an OverlayProvider');
  }
  return context;
};
