import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CheckoutFeed from './CheckoutFeed';
import CheckoutTreeView1 from './CheckoutTreeView1';

interface CheckoutContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CheckoutContextContextValue {
  state: CheckoutContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CheckoutContextContext = createContext<CheckoutContextContextValue | null>(null);

export function useCheckoutContext() {
  const ctx = useContext(CheckoutContextContext);
  if (!ctx) {
    throw new Error(`useCheckoutContext must be used within a CheckoutContext`);
  }
  return ctx;
}

interface CheckoutContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CheckoutContext({
  children,
  initialActive = false,
  initialLabel = 'CheckoutContext',
}: CheckoutContextProps) {
  const [state, setState] = useState<CheckoutContextState>({
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

  const contextValue = useMemo<CheckoutContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CheckoutContextContext.Provider value={contextValue}>
      {children}
      <CheckoutFeed />
      <CheckoutTreeView1 />
    </CheckoutContextContext.Provider>
  );
}
