import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import InventoryAccordion from './InventoryAccordion';
import OrdersScore1 from '../orders/OrdersScore1';

interface InventoryWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface InventoryWrapperContextValue {
  state: InventoryWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const InventoryWrapperContext = createContext<InventoryWrapperContextValue | null>(null);

export function useInventoryWrapper() {
  const ctx = useContext(InventoryWrapperContext);
  if (!ctx) {
    throw new Error(`useInventoryWrapper must be used within a InventoryWrapper`);
  }
  return ctx;
}

interface InventoryWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function InventoryWrapper({
  children,
  initialActive = false,
  initialLabel = 'InventoryWrapper',
}: InventoryWrapperProps) {
  const [state, setState] = useState<InventoryWrapperState>({
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

  const contextValue = useMemo<InventoryWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <InventoryWrapperContext.Provider value={contextValue}>
      {children}
      <InventoryAccordion />
      <OrdersScore1 />
    </InventoryWrapperContext.Provider>
  );
}
