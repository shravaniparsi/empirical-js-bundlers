import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import InventoryPrefetch from './InventoryPrefetch';

interface InventoryProviderState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface InventoryProviderContextValue {
  state: InventoryProviderState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const InventoryProviderContext = createContext<InventoryProviderContextValue | null>(null);

export function useInventoryProvider() {
  const ctx = useContext(InventoryProviderContext);
  if (!ctx) {
    throw new Error(`useInventoryProvider must be used within a InventoryProvider`);
  }
  return ctx;
}

interface InventoryProviderProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function InventoryProvider({
  children,
  initialActive = false,
  initialLabel = 'InventoryProvider',
}: InventoryProviderProps) {
  const [state, setState] = useState<InventoryProviderState>({
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

  const contextValue = useMemo<InventoryProviderContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <InventoryProviderContext.Provider value={contextValue}>
      {children}
      <InventoryPrefetch />
    </InventoryProviderContext.Provider>
  );
}
