import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ShippingMeter from './ShippingMeter';
import ShippingTag1 from './ShippingTag1';

interface ShippingProviderState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ShippingProviderContextValue {
  state: ShippingProviderState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ShippingProviderContext = createContext<ShippingProviderContextValue | null>(null);

export function useShippingProvider() {
  const ctx = useContext(ShippingProviderContext);
  if (!ctx) {
    throw new Error(`useShippingProvider must be used within a ShippingProvider`);
  }
  return ctx;
}

interface ShippingProviderProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ShippingProvider({
  children,
  initialActive = false,
  initialLabel = 'ShippingProvider',
}: ShippingProviderProps) {
  const [state, setState] = useState<ShippingProviderState>({
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

  const contextValue = useMemo<ShippingProviderContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ShippingProviderContext.Provider value={contextValue}>
      {children}
      <ShippingMeter />
      <ShippingTag1 />
    </ShippingProviderContext.Provider>
  );
}
