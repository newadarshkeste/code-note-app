
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  isStudyToolsOpen: boolean;
  setStudyToolsOpen: (isOpen: boolean) => void;
  showStudyTools: () => void;
  isQuizGeneratorOpen: boolean;
  setQuizGeneratorOpen: (isOpen: boolean) => void;
  showQuizGenerator: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isStudyToolsOpen, setStudyToolsOpen] = useState(false);
  const [isQuizGeneratorOpen, setQuizGeneratorOpen] = useState(false);

  const showStudyTools = () => {
    setQuizGeneratorOpen(false);
    setStudyToolsOpen(true);
  };

  const showQuizGenerator = () => {
    setStudyToolsOpen(false);
    setQuizGeneratorOpen(true);
  };

  const value = {
    isStudyToolsOpen,
    setStudyToolsOpen,
    showStudyTools,
    isQuizGeneratorOpen,
    setQuizGeneratorOpen,
    showQuizGenerator,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
