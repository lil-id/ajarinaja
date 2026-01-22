import { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

/**
 * Context provider for sidebar state (collapsed/expanded, mobile open/closed).
 * 
 * @param {object} props - Component props.
 * @param {ReactNode} props.children - Child components to render.
 * @returns {JSX.Element} The provider component.
 */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{
      sidebarCollapsed,
      setSidebarCollapsed,
      sidebarOpen,
      setSidebarOpen
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

/**
 * Custom hook to access the sidebar context.
 * 
 * @returns {SidebarContextType} The sidebar context value.
 * @throws {Error} If used outside of a SidebarProvider.
 */
export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }
  return context;
}
