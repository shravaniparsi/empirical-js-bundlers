import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CheckoutGrid from './CheckoutGrid';
import CheckoutBadge from './CheckoutBadge';

interface CheckoutHOC1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CheckoutHOC1ContextValue {
  state: CheckoutHOC1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CheckoutHOC1Context = createContext<CheckoutHOC1ContextValue | null>(null);

export function useCheckoutHOC1() {
  const ctx = useContext(CheckoutHOC1Context);
  if (!ctx) {
    throw new Error(`useCheckoutHOC1 must be used within a CheckoutHOC1`);
  }
  return ctx;
}

interface CheckoutHOC1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CheckoutHOC1({
  children,
  initialActive = false,
  initialLabel = 'CheckoutHOC1',
}: CheckoutHOC1Props) {
  const [state, setState] = useState<CheckoutHOC1State>({
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

  const contextValue = useMemo<CheckoutHOC1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CheckoutHOC1Context.Provider value={contextValue}>
      {children}
      <CheckoutGrid />
      <CheckoutBadge />
    </CheckoutHOC1Context.Provider>
  );
}
