import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ShippingSparkline from './ShippingSparkline';

interface ShippingHookState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ShippingHookContextValue {
  state: ShippingHookState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ShippingHookContext = createContext<ShippingHookContextValue | null>(null);

export function useShippingHook() {
  const ctx = useContext(ShippingHookContext);
  if (!ctx) {
    throw new Error(`useShippingHook must be used within a ShippingHook`);
  }
  return ctx;
}

interface ShippingHookProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ShippingHook({
  children,
  initialActive = false,
  initialLabel = 'ShippingHook',
}: ShippingHookProps) {
  const [state, setState] = useState<ShippingHookState>({
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

  const contextValue = useMemo<ShippingHookContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ShippingHookContext.Provider value={contextValue}>
      {children}
      <ShippingSparkline />
    </ShippingHookContext.Provider>
  );
}
