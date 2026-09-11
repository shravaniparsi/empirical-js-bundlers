import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface CheckoutFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CheckoutFactoryContextValue {
  state: CheckoutFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CheckoutFactoryContext = createContext<CheckoutFactoryContextValue | null>(null);

export function useCheckoutFactory() {
  const ctx = useContext(CheckoutFactoryContext);
  if (!ctx) {
    throw new Error(`useCheckoutFactory must be used within a CheckoutFactory`);
  }
  return ctx;
}

interface CheckoutFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CheckoutFactory({
  children,
  initialActive = false,
  initialLabel = 'CheckoutFactory',
}: CheckoutFactoryProps) {
  const [state, setState] = useState<CheckoutFactoryState>({
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

  const contextValue = useMemo<CheckoutFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CheckoutFactoryContext.Provider value={contextValue}>
      {children}

    </CheckoutFactoryContext.Provider>
  );
}
