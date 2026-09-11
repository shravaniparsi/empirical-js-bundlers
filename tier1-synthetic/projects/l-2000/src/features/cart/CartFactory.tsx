import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CartSidebar1 from './CartSidebar1';
import CartSparkline2 from './CartSparkline2';
import CartRetry from './CartRetry';
import ReportsScatter from '../reports/ReportsScatter';

interface CartFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CartFactoryContextValue {
  state: CartFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CartFactoryContext = createContext<CartFactoryContextValue | null>(null);

export function useCartFactory() {
  const ctx = useContext(CartFactoryContext);
  if (!ctx) {
    throw new Error(`useCartFactory must be used within a CartFactory`);
  }
  return ctx;
}

interface CartFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CartFactory({
  children,
  initialActive = false,
  initialLabel = 'CartFactory',
}: CartFactoryProps) {
  const [state, setState] = useState<CartFactoryState>({
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

  const contextValue = useMemo<CartFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CartFactoryContext.Provider value={contextValue}>
      {children}
      <CartSidebar1 />
      <CartSparkline2 />
      <CartRetry />
      <ReportsScatter />
    </CartFactoryContext.Provider>
  );
}
