import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ShippingConfirm1 from './ShippingConfirm1';

interface ShippingBridge1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ShippingBridge1ContextValue {
  state: ShippingBridge1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ShippingBridge1Context = createContext<ShippingBridge1ContextValue | null>(null);

export function useShippingBridge1() {
  const ctx = useContext(ShippingBridge1Context);
  if (!ctx) {
    throw new Error(`useShippingBridge1 must be used within a ShippingBridge1`);
  }
  return ctx;
}

interface ShippingBridge1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ShippingBridge1({
  children,
  initialActive = false,
  initialLabel = 'ShippingBridge1',
}: ShippingBridge1Props) {
  const [state, setState] = useState<ShippingBridge1State>({
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

  const contextValue = useMemo<ShippingBridge1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ShippingBridge1Context.Provider value={contextValue}>
      {children}
      <ShippingConfirm1 />
    </ShippingBridge1Context.Provider>
  );
}
