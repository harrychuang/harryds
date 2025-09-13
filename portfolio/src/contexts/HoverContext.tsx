import React, { createContext, useContext, useState, ReactNode } from 'react';

interface HoverContextType {
  hoveredCardId: number | null;
  setHoveredCardId: (id: number | null) => void;
}

const HoverContext = createContext<HoverContextType>({
  hoveredCardId: null,
  setHoveredCardId: () => {},
});

interface HoverProviderProps {
  children: ReactNode;
}

export const HoverProvider: React.FC<HoverProviderProps> = ({ children }) => {
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);

  return (
    <HoverContext.Provider value={{ hoveredCardId, setHoveredCardId }}>
      {children}
    </HoverContext.Provider>
  );
};

export const useHover = () => {
  const context = useContext(HoverContext);
  if (!context) {
    throw new Error('useHover must be used within a HoverProvider');
  }
  return context;
};
