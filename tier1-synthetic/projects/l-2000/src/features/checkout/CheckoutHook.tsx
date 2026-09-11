import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface CheckoutHookState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CheckoutHookContextValue {
  state: CheckoutHookState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CheckoutHookContext = createContext<CheckoutHookContextValue | null>(null);

export function useCheckoutHook() {
  const ctx = useContext(CheckoutHookContext);
  if (!ctx) {
    throw new Error(`useCheckoutHook must be used within a CheckoutHook`);
  }
  return ctx;
}

interface CheckoutHookProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CheckoutHook({
  children,
  initialActive = false,
  initialLabel = 'CheckoutHook',
}: CheckoutHookProps) {
  const [state, setState] = useState<CheckoutHookState>({
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

  const contextValue = useMemo<CheckoutHookContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CheckoutHookContext.Provider value={contextValue}>
      {children}

    </CheckoutHookContext.Provider>
  );
}
