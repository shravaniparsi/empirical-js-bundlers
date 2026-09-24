import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ApiKeysMeter from './ApiKeysMeter';

interface ApiKeysHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ApiKeysHOCContextValue {
  state: ApiKeysHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ApiKeysHOCContext = createContext<ApiKeysHOCContextValue | null>(null);

export function useApiKeysHOC() {
  const ctx = useContext(ApiKeysHOCContext);
  if (!ctx) {
    throw new Error(`useApiKeysHOC must be used within a ApiKeysHOC`);
  }
  return ctx;
}

interface ApiKeysHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ApiKeysHOC({
  children,
  initialActive = false,
  initialLabel = 'ApiKeysHOC',
}: ApiKeysHOCProps) {
  const [state, setState] = useState<ApiKeysHOCState>({
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

  const contextValue = useMemo<ApiKeysHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ApiKeysHOCContext.Provider value={contextValue}>
      {children}
      <ApiKeysMeter />
    </ApiKeysHOCContext.Provider>
  );
}
