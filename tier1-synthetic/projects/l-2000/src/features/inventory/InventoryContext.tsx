import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import InventoryToast from './InventoryToast';
import InventoryModal from './InventoryModal';
import InventoryList from './InventoryList';

interface InventoryContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface InventoryContextContextValue {
  state: InventoryContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const InventoryContextContext = createContext<InventoryContextContextValue | null>(null);

export function useInventoryContext() {
  const ctx = useContext(InventoryContextContext);
  if (!ctx) {
    throw new Error(`useInventoryContext must be used within a InventoryContext`);
  }
  return ctx;
}

interface InventoryContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function InventoryContext({
  children,
  initialActive = false,
  initialLabel = 'InventoryContext',
}: InventoryContextProps) {
  const [state, setState] = useState<InventoryContextState>({
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

  const contextValue = useMemo<InventoryContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <InventoryContextContext.Provider value={contextValue}>
      {children}
      <InventoryToast />
      <InventoryModal />
      <InventoryList />
    </InventoryContextContext.Provider>
  );
}
