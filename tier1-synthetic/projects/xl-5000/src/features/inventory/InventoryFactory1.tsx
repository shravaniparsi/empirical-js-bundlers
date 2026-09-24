import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import InventoryHeader2 from './InventoryHeader2';
import InventoryScore from './InventoryScore';
import InventorySplit from './InventorySplit';

interface InventoryFactory1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface InventoryFactory1ContextValue {
  state: InventoryFactory1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const InventoryFactory1Context = createContext<InventoryFactory1ContextValue | null>(null);

export function useInventoryFactory1() {
  const ctx = useContext(InventoryFactory1Context);
  if (!ctx) {
    throw new Error(`useInventoryFactory1 must be used within a InventoryFactory1`);
  }
  return ctx;
}

interface InventoryFactory1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function InventoryFactory1({
  children,
  initialActive = false,
  initialLabel = 'InventoryFactory1',
}: InventoryFactory1Props) {
  const [state, setState] = useState<InventoryFactory1State>({
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

  const contextValue = useMemo<InventoryFactory1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <InventoryFactory1Context.Provider value={contextValue}>
      {children}
      <InventoryHeader2 />
      <InventoryScore />
      <InventorySplit />
    </InventoryFactory1Context.Provider>
  );
}
