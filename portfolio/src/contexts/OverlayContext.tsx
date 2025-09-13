import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';

type OverlayAnimationPhase = 'closed' | 'loading' | 'positioning' | 'expanding' | 'ready';

interface OverlayContextType {
  openCardId: number | null;
  setOpenCardId: (id: number | null) => void;
  animationPhase: OverlayAnimationPhase;
  setAnimationPhase: (phase: OverlayAnimationPhase) => void;
  overlayScrollRef: React.MutableRefObject<HTMLDivElement | null>;
}

const OverlayContext = createContext<OverlayContextType>({
  openCardId: null,
  setOpenCardId: () => {},
  animationPhase: 'closed',
  setAnimationPhase: () => {},
  overlayScrollRef: { current: null },
});

interface OverlayProviderProps {
  children: ReactNode;
}

export const OverlayProvider: React.FC<OverlayProviderProps> = ({ children }) => {
  const [openCardId, setOpenCardId] = useState<number | null>(null);
  const [animationPhase, setAnimationPhase] = useState<OverlayAnimationPhase>('closed');
  const overlayScrollRef = useRef<HTMLDivElement | null>(null);

  return (
    <OverlayContext.Provider value={{
      openCardId,
      setOpenCardId,
      animationPhase,
      setAnimationPhase,
      overlayScrollRef,
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
