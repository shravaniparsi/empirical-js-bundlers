import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CartDrawer from './CartDrawer';

interface CartHookState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CartHookContextValue {
  state: CartHookState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CartHookContext = createContext<CartHookContextValue | null>(null);

export function useCartHook() {
  const ctx = useContext(CartHookContext);
  if (!ctx) {
    throw new Error(`useCartHook must be used within a CartHook`);
  }
  return ctx;
}

interface CartHookProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CartHook({
  children,
  initialActive = false,
  initialLabel = 'CartHook',
}: CartHookProps) {
  const [state, setState] = useState<CartHookState>({
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

  const contextValue = useMemo<CartHookContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CartHookContext.Provider value={contextValue}>
      {children}
      <CartDrawer />
    </CartHookContext.Provider>
  );
}
