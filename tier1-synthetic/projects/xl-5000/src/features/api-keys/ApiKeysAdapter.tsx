import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ApiKeysCollapse from './ApiKeysCollapse';
import DashboardPanel1 from '../dashboard/DashboardPanel1';

interface ApiKeysAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ApiKeysAdapterContextValue {
  state: ApiKeysAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ApiKeysAdapterContext = createContext<ApiKeysAdapterContextValue | null>(null);

export function useApiKeysAdapter() {
  const ctx = useContext(ApiKeysAdapterContext);
  if (!ctx) {
    throw new Error(`useApiKeysAdapter must be used within a ApiKeysAdapter`);
  }
  return ctx;
}

interface ApiKeysAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ApiKeysAdapter({
  children,
  initialActive = false,
  initialLabel = 'ApiKeysAdapter',
}: ApiKeysAdapterProps) {
  const [state, setState] = useState<ApiKeysAdapterState>({
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

  const contextValue = useMemo<ApiKeysAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ApiKeysAdapterContext.Provider value={contextValue}>
      {children}
      <ApiKeysCollapse />
      <DashboardPanel1 />
    </ApiKeysAdapterContext.Provider>
  );
}
