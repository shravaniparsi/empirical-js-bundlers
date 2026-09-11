import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface ShippingProvider1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ShippingProvider1ContextValue {
  state: ShippingProvider1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ShippingProvider1Context = createContext<ShippingProvider1ContextValue | null>(null);

export function useShippingProvider1() {
  const ctx = useContext(ShippingProvider1Context);
  if (!ctx) {
    throw new Error(`useShippingProvider1 must be used within a ShippingProvider1`);
  }
  return ctx;
}

interface ShippingProvider1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ShippingProvider1({
  children,
  initialActive = false,
  initialLabel = 'ShippingProvider1',
}: ShippingProvider1Props) {
  const [state, setState] = useState<ShippingProvider1State>({
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

  const contextValue = useMemo<ShippingProvider1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ShippingProvider1Context.Provider value={contextValue}>
      {children}

    </ShippingProvider1Context.Provider>
  );
}
