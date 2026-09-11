import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ApiKeysStat from './ApiKeysStat';
import ApiKeysErrorBoundary from './ApiKeysErrorBoundary';

interface ApiKeysBridgeState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ApiKeysBridgeContextValue {
  state: ApiKeysBridgeState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ApiKeysBridgeContext = createContext<ApiKeysBridgeContextValue | null>(null);

export function useApiKeysBridge() {
  const ctx = useContext(ApiKeysBridgeContext);
  if (!ctx) {
    throw new Error(`useApiKeysBridge must be used within a ApiKeysBridge`);
  }
  return ctx;
}

interface ApiKeysBridgeProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ApiKeysBridge({
  children,
  initialActive = false,
  initialLabel = 'ApiKeysBridge',
}: ApiKeysBridgeProps) {
  const [state, setState] = useState<ApiKeysBridgeState>({
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

  const contextValue = useMemo<ApiKeysBridgeContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ApiKeysBridgeContext.Provider value={contextValue}>
      {children}
      <ApiKeysStat />
      <ApiKeysErrorBoundary />
    </ApiKeysBridgeContext.Provider>
  );
}
