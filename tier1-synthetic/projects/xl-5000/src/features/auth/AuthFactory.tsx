import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AuthScroll from './AuthScroll';

interface AuthFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AuthFactoryContextValue {
  state: AuthFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AuthFactoryContext = createContext<AuthFactoryContextValue | null>(null);

export function useAuthFactory() {
  const ctx = useContext(AuthFactoryContext);
  if (!ctx) {
    throw new Error(`useAuthFactory must be used within a AuthFactory`);
  }
  return ctx;
}

interface AuthFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AuthFactory({
  children,
  initialActive = false,
  initialLabel = 'AuthFactory',
}: AuthFactoryProps) {
  const [state, setState] = useState<AuthFactoryState>({
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

  const contextValue = useMemo<AuthFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AuthFactoryContext.Provider value={contextValue}>
      {children}
      <AuthScroll />
    </AuthFactoryContext.Provider>
  );
}
