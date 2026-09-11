import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ApiKeysGrid from './ApiKeysGrid';

interface ApiKeysWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ApiKeysWrapperContextValue {
  state: ApiKeysWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ApiKeysWrapperContext = createContext<ApiKeysWrapperContextValue | null>(null);

export function useApiKeysWrapper() {
  const ctx = useContext(ApiKeysWrapperContext);
  if (!ctx) {
    throw new Error(`useApiKeysWrapper must be used within a ApiKeysWrapper`);
  }
  return ctx;
}

interface ApiKeysWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ApiKeysWrapper({
  children,
  initialActive = false,
  initialLabel = 'ApiKeysWrapper',
}: ApiKeysWrapperProps) {
  const [state, setState] = useState<ApiKeysWrapperState>({
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

  const contextValue = useMemo<ApiKeysWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ApiKeysWrapperContext.Provider value={contextValue}>
      {children}
      <ApiKeysGrid />
    </ApiKeysWrapperContext.Provider>
  );
}
