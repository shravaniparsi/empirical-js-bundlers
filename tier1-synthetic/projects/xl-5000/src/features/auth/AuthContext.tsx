import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AuthAlert from './AuthAlert';

interface AuthContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AuthContextContextValue {
  state: AuthContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AuthContextContext = createContext<AuthContextContextValue | null>(null);

export function useAuthContext() {
  const ctx = useContext(AuthContextContext);
  if (!ctx) {
    throw new Error(`useAuthContext must be used within a AuthContext`);
  }
  return ctx;
}

interface AuthContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AuthContext({
  children,
  initialActive = false,
  initialLabel = 'AuthContext',
}: AuthContextProps) {
  const [state, setState] = useState<AuthContextState>({
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

  const contextValue = useMemo<AuthContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AuthContextContext.Provider value={contextValue}>
      {children}
      <AuthAlert />
    </AuthContextContext.Provider>
  );
}
