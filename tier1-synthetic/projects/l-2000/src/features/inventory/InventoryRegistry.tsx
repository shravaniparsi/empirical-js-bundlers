import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface InventoryRegistryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface InventoryRegistryContextValue {
  state: InventoryRegistryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const InventoryRegistryContext = createContext<InventoryRegistryContextValue | null>(null);

export function useInventoryRegistry() {
  const ctx = useContext(InventoryRegistryContext);
  if (!ctx) {
    throw new Error(`useInventoryRegistry must be used within a InventoryRegistry`);
  }
  return ctx;
}

interface InventoryRegistryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function InventoryRegistry({
  children,
  initialActive = false,
  initialLabel = 'InventoryRegistry',
}: InventoryRegistryProps) {
  const [state, setState] = useState<InventoryRegistryState>({
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

  const contextValue = useMemo<InventoryRegistryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <InventoryRegistryContext.Provider value={contextValue}>
      {children}

    </InventoryRegistryContext.Provider>
  );
}
