import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ShippingRangeSlider from './ShippingRangeSlider';
import ShippingPopover from './ShippingPopover';

interface ShippingFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ShippingFactoryContextValue {
  state: ShippingFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ShippingFactoryContext = createContext<ShippingFactoryContextValue | null>(null);

export function useShippingFactory() {
  const ctx = useContext(ShippingFactoryContext);
  if (!ctx) {
    throw new Error(`useShippingFactory must be used within a ShippingFactory`);
  }
  return ctx;
}

interface ShippingFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ShippingFactory({
  children,
  initialActive = false,
  initialLabel = 'ShippingFactory',
}: ShippingFactoryProps) {
  const [state, setState] = useState<ShippingFactoryState>({
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

  const contextValue = useMemo<ShippingFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ShippingFactoryContext.Provider value={contextValue}>
      {children}
      <ShippingRangeSlider />
      <ShippingPopover />
    </ShippingFactoryContext.Provider>
  );
}
