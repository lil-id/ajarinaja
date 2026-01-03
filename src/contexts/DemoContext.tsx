import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DemoContextType {
  isDemo: boolean;
  demoRole: 'teacher' | 'student';
  setDemoRole: (role: 'teacher' | 'student') => void;
  exitDemo: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const useDemoContext = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemoContext must be used within a DemoProvider');
  }
  return context;
};

export const useIsDemo = () => {
  const context = useContext(DemoContext);
  return context?.isDemo ?? false;
};

interface DemoProviderProps {
  children: ReactNode;
}

export const DemoProvider: React.FC<DemoProviderProps> = ({ children }) => {
  const [isDemo] = useState(true);
  const [demoRole, setDemoRole] = useState<'teacher' | 'student'>('teacher');

  const exitDemo = () => {
    window.location.href = '/';
  };

  return (
    <DemoContext.Provider value={{ isDemo, demoRole, setDemoRole, exitDemo }}>
      {children}
    </DemoContext.Provider>
  );
};
