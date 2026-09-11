import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ApiKeysModal from './ApiKeysModal';
import ApiKeysInfiniteScroll1 from './ApiKeysInfiniteScroll1';

interface ApiKeysHOC1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ApiKeysHOC1ContextValue {
  state: ApiKeysHOC1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ApiKeysHOC1Context = createContext<ApiKeysHOC1ContextValue | null>(null);

export function useApiKeysHOC1() {
  const ctx = useContext(ApiKeysHOC1Context);
  if (!ctx) {
    throw new Error(`useApiKeysHOC1 must be used within a ApiKeysHOC1`);
  }
  return ctx;
}

interface ApiKeysHOC1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ApiKeysHOC1({
  children,
  initialActive = false,
  initialLabel = 'ApiKeysHOC1',
}: ApiKeysHOC1Props) {
  const [state, setState] = useState<ApiKeysHOC1State>({
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

  const contextValue = useMemo<ApiKeysHOC1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ApiKeysHOC1Context.Provider value={contextValue}>
      {children}
      <ApiKeysModal />
      <ApiKeysInfiniteScroll1 />
    </ApiKeysHOC1Context.Provider>
  );
}
