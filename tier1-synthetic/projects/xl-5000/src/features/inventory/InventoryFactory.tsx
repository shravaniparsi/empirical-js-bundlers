import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import InventoryThumbnail from './InventoryThumbnail';

interface InventoryFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface InventoryFactoryContextValue {
  state: InventoryFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const InventoryFactoryContext = createContext<InventoryFactoryContextValue | null>(null);

export function useInventoryFactory() {
  const ctx = useContext(InventoryFactoryContext);
  if (!ctx) {
    throw new Error(`useInventoryFactory must be used within a InventoryFactory`);
  }
  return ctx;
}

interface InventoryFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function InventoryFactory({
  children,
  initialActive = false,
  initialLabel = 'InventoryFactory',
}: InventoryFactoryProps) {
  const [state, setState] = useState<InventoryFactoryState>({
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

  const contextValue = useMemo<InventoryFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <InventoryFactoryContext.Provider value={contextValue}>
      {children}
      <InventoryThumbnail />
    </InventoryFactoryContext.Provider>
  );
}
