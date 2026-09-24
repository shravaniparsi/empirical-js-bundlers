import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import InventoryBridge from './InventoryBridge';
import InventoryToggle1 from './InventoryToggle1';
import InventorySelect2 from './InventorySelect2';
import ShippingTable from '../shipping/ShippingTable';

interface InventoryAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface InventoryAdapterContextValue {
  state: InventoryAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const InventoryAdapterContext = createContext<InventoryAdapterContextValue | null>(null);

export function useInventoryAdapter() {
  const ctx = useContext(InventoryAdapterContext);
  if (!ctx) {
    throw new Error(`useInventoryAdapter must be used within a InventoryAdapter`);
  }
  return ctx;
}

interface InventoryAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function InventoryAdapter({
  children,
  initialActive = false,
  initialLabel = 'InventoryAdapter',
}: InventoryAdapterProps) {
  const [state, setState] = useState<InventoryAdapterState>({
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

  const contextValue = useMemo<InventoryAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <InventoryAdapterContext.Provider value={contextValue}>
      {children}
      <InventoryBridge />
      <InventoryToggle1 />
      <InventorySelect2 />
      <ShippingTable />
    </InventoryAdapterContext.Provider>
  );
}
