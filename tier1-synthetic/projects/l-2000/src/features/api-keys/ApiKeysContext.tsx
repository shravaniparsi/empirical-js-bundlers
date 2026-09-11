import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ApiKeysTimePicker1 from './ApiKeysTimePicker1';

interface ApiKeysContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ApiKeysContextContextValue {
  state: ApiKeysContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ApiKeysContextContext = createContext<ApiKeysContextContextValue | null>(null);

export function useApiKeysContext() {
  const ctx = useContext(ApiKeysContextContext);
  if (!ctx) {
    throw new Error(`useApiKeysContext must be used within a ApiKeysContext`);
  }
  return ctx;
}

interface ApiKeysContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ApiKeysContext({
  children,
  initialActive = false,
  initialLabel = 'ApiKeysContext',
}: ApiKeysContextProps) {
  const [state, setState] = useState<ApiKeysContextState>({
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

  const contextValue = useMemo<ApiKeysContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ApiKeysContextContext.Provider value={contextValue}>
      {children}
      <ApiKeysTimePicker1 />
    </ApiKeysContextContext.Provider>
  );
}
