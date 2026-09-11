import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AuthMenu from './AuthMenu';
import AuthScroll2 from './AuthScroll2';
import AuthTag from './AuthTag';

interface AuthWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AuthWrapperContextValue {
  state: AuthWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AuthWrapperContext = createContext<AuthWrapperContextValue | null>(null);

export function useAuthWrapper() {
  const ctx = useContext(AuthWrapperContext);
  if (!ctx) {
    throw new Error(`useAuthWrapper must be used within a AuthWrapper`);
  }
  return ctx;
}

interface AuthWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AuthWrapper({
  children,
  initialActive = false,
  initialLabel = 'AuthWrapper',
}: AuthWrapperProps) {
  const [state, setState] = useState<AuthWrapperState>({
    isActive: initialActive,
    count: 0,
    label: initialLabel,
    metadata: {},
  });

  const toggle = useCallback(() => {
    setState(prev => ({ ...prev, isActive: !prev.isActive }));
  }, []);

  const increment = useCallback(() => {
    setState(prev => ({ ...prev, count: prev.count + 1 }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isActive: initialActive,
      count: 0,
      label: initialLabel,
      metadata: {},
    });
  }, [initialActive, initialLabel]);

  const updateLabel = useCallback((label: string) => {
    setState(prev => ({ ...prev, label }));
  }, []);

  const setMeta = useCallback((key: string, value: unknown) => {
    setState(prev => ({
      ...prev,
      metadata: { ...prev.metadata, [key]: value },
    }));
  }, []);

  const contextValue = useMemo<AuthWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AuthWrapperContext.Provider value={contextValue}>
      {children}
      <AuthMenu />
      <AuthScroll2 />
      <AuthTag />
    </AuthWrapperContext.Provider>
  );
}
