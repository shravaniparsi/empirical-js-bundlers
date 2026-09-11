import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import InventoryRank1 from './InventoryRank1';

interface InventoryBridgeState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface InventoryBridgeContextValue {
  state: InventoryBridgeState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const InventoryBridgeContext = createContext<InventoryBridgeContextValue | null>(null);

export function useInventoryBridge() {
  const ctx = useContext(InventoryBridgeContext);
  if (!ctx) {
    throw new Error(`useInventoryBridge must be used within a InventoryBridge`);
  }
  return ctx;
}

interface InventoryBridgeProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function InventoryBridge({
  children,
  initialActive = false,
  initialLabel = 'InventoryBridge',
}: InventoryBridgeProps) {
  const [state, setState] = useState<InventoryBridgeState>({
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

  const contextValue = useMemo<InventoryBridgeContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <InventoryBridgeContext.Provider value={contextValue}>
      {children}
      <InventoryRank1 />
    </InventoryBridgeContext.Provider>
  );
}
