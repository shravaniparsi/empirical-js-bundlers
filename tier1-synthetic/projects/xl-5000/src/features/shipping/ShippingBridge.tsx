import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ShippingCollapse from './ShippingCollapse';

interface ShippingBridgeState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ShippingBridgeContextValue {
  state: ShippingBridgeState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ShippingBridgeContext = createContext<ShippingBridgeContextValue | null>(null);

export function useShippingBridge() {
  const ctx = useContext(ShippingBridgeContext);
  if (!ctx) {
    throw new Error(`useShippingBridge must be used within a ShippingBridge`);
  }
  return ctx;
}

interface ShippingBridgeProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ShippingBridge({
  children,
  initialActive = false,
  initialLabel = 'ShippingBridge',
}: ShippingBridgeProps) {
  const [state, setState] = useState<ShippingBridgeState>({
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

  const contextValue = useMemo<ShippingBridgeContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ShippingBridgeContext.Provider value={contextValue}>
      {children}
      <ShippingCollapse />
    </ShippingBridgeContext.Provider>
  );
}
