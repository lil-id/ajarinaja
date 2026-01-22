import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DemoContextType {
  isDemo: boolean;
  demoRole: 'teacher' | 'student';
  setDemoRole: (role: 'teacher' | 'student') => void;
  exitDemo: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

/**
 * Custom hook to access the demo context.
 * 
 * @returns {DemoContextType} The demo context value.
 * @throws {Error} If used outside of a DemoProvider.
 */
export const useDemoContext = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemoContext must be used within a DemoProvider');
  }
  return context;
};

/**
 * Custom hook to check if the app is in demo mode.
 * 
 * @returns {boolean} True if in demo mode, false otherwise.
 */
export const useIsDemo = () => {
  const context = useContext(DemoContext);
  return context?.isDemo ?? false;
};

interface DemoProviderProps {
  children: ReactNode;
}

/**
 * Context provider for demo mode state and methods.
 * 
 * @param {DemoProviderProps} props - Component props.
 * @returns {JSX.Element} The provider component.
 */
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
