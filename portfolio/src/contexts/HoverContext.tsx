import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CustomColors {
  primaryColor?: string;
  secondaryColor?: string;
}

interface HoverContextType {
  hoveredCardId: number | null;
  setHoveredCardId: (id: number | null) => void;
  customColors: CustomColors | null;
  setCustomColors: (colors: CustomColors | null) => void;
}

const HoverContext = createContext<HoverContextType>({
  hoveredCardId: null,
  setHoveredCardId: () => {},
  customColors: null,
  setCustomColors: () => {},
});

interface HoverProviderProps {
  children: ReactNode;
}

export const HoverProvider: React.FC<HoverProviderProps> = ({ children }) => {
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);
  const [customColors, setCustomColors] = useState<CustomColors | null>(null);

  return (
    <HoverContext.Provider value={{ hoveredCardId, setHoveredCardId, customColors, setCustomColors }}>
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
