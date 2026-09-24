import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CartAutocomplete from './CartAutocomplete';
import WebhooksRank from '../webhooks/WebhooksRank';

interface CartProvider1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CartProvider1ContextValue {
  state: CartProvider1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CartProvider1Context = createContext<CartProvider1ContextValue | null>(null);

export function useCartProvider1() {
  const ctx = useContext(CartProvider1Context);
  if (!ctx) {
    throw new Error(`useCartProvider1 must be used within a CartProvider1`);
  }
  return ctx;
}

interface CartProvider1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CartProvider1({
  children,
  initialActive = false,
  initialLabel = 'CartProvider1',
}: CartProvider1Props) {
  const [state, setState] = useState<CartProvider1State>({
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

  const contextValue = useMemo<CartProvider1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CartProvider1Context.Provider value={contextValue}>
      {children}
      <CartAutocomplete />
      <WebhooksRank />
    </CartProvider1Context.Provider>
  );
}
