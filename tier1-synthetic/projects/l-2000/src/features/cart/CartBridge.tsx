import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CartTextArea from './CartTextArea';
import CartToggle1 from './CartToggle1';
import CartBottomNav from './CartBottomNav';

interface CartBridgeState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CartBridgeContextValue {
  state: CartBridgeState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CartBridgeContext = createContext<CartBridgeContextValue | null>(null);

export function useCartBridge() {
  const ctx = useContext(CartBridgeContext);
  if (!ctx) {
    throw new Error(`useCartBridge must be used within a CartBridge`);
  }
  return ctx;
}

interface CartBridgeProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CartBridge({
  children,
  initialActive = false,
  initialLabel = 'CartBridge',
}: CartBridgeProps) {
  const [state, setState] = useState<CartBridgeState>({
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

  const contextValue = useMemo<CartBridgeContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CartBridgeContext.Provider value={contextValue}>
      {children}
      <CartTextArea />
      <CartToggle1 />
      <CartBottomNav />
    </CartBridgeContext.Provider>
  );
}
