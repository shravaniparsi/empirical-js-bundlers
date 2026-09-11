import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CartToggle from './CartToggle';
import WebhooksFeed1 from '../webhooks/WebhooksFeed1';

interface CartProviderState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CartProviderContextValue {
  state: CartProviderState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CartProviderContext = createContext<CartProviderContextValue | null>(null);

export function useCartProvider() {
  const ctx = useContext(CartProviderContext);
  if (!ctx) {
    throw new Error(`useCartProvider must be used within a CartProvider`);
  }
  return ctx;
}

interface CartProviderProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CartProvider({
  children,
  initialActive = false,
  initialLabel = 'CartProvider',
}: CartProviderProps) {
  const [state, setState] = useState<CartProviderState>({
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

  const contextValue = useMemo<CartProviderContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CartProviderContext.Provider value={contextValue}>
      {children}
      <CartToggle />
      <WebhooksFeed1 />
    </CartProviderContext.Provider>
  );
}
