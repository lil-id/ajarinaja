import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

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
 * Determine the initial demo role from the current URL path.
 * This ensures the role is preserved on browser refresh.
 */
const getRoleFromPath = (pathname: string): 'teacher' | 'student' => {
  if (pathname.includes('/demo/student')) {
    return 'student';
  }
  return 'teacher';
};

/**
 * Context provider for demo mode state and methods.
 * Persists demo role based on URL path to maintain state on refresh.
 * 
 * @param {DemoProviderProps} props - Component props.
 * @returns {JSX.Element} The provider component.
 */
export const DemoProvider: React.FC<DemoProviderProps> = ({ children }) => {
  const location = useLocation();
  const [isDemo] = useState(true);
  const [demoRole, setDemoRole] = useState<'teacher' | 'student'>(() => getRoleFromPath(location.pathname));

  // Sync role with URL path changes (e.g., when navigating via browser back/forward)
  useEffect(() => {
    const roleFromPath = getRoleFromPath(location.pathname);
    if (roleFromPath !== demoRole) {
      setDemoRole(roleFromPath);
    }
  }, [location.pathname]);

  const exitDemo = () => {
    window.location.href = '/';
  };

  return (
    <DemoContext.Provider value={{ isDemo, demoRole, setDemoRole, exitDemo }}>
      {children}
    </DemoContext.Provider>
  );
};
