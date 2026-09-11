import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import InventoryToggle2 from './InventoryToggle2';
import InventoryFooter from './InventoryFooter';

interface InventoryAdapter1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface InventoryAdapter1ContextValue {
  state: InventoryAdapter1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const InventoryAdapter1Context = createContext<InventoryAdapter1ContextValue | null>(null);

export function useInventoryAdapter1() {
  const ctx = useContext(InventoryAdapter1Context);
  if (!ctx) {
    throw new Error(`useInventoryAdapter1 must be used within a InventoryAdapter1`);
  }
  return ctx;
}

interface InventoryAdapter1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function InventoryAdapter1({
  children,
  initialActive = false,
  initialLabel = 'InventoryAdapter1',
}: InventoryAdapter1Props) {
  const [state, setState] = useState<InventoryAdapter1State>({
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

  const contextValue = useMemo<InventoryAdapter1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <InventoryAdapter1Context.Provider value={contextValue}>
      {children}
      <InventoryToggle2 />
      <InventoryFooter />
    </InventoryAdapter1Context.Provider>
  );
}
