import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import OrdersDrawer from './OrdersDrawer';
import OrdersPanel from './OrdersPanel';

interface OrdersFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface OrdersFactoryContextValue {
  state: OrdersFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const OrdersFactoryContext = createContext<OrdersFactoryContextValue | null>(null);

export function useOrdersFactory() {
  const ctx = useContext(OrdersFactoryContext);
  if (!ctx) {
    throw new Error(`useOrdersFactory must be used within a OrdersFactory`);
  }
  return ctx;
}

interface OrdersFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function OrdersFactory({
  children,
  initialActive = false,
  initialLabel = 'OrdersFactory',
}: OrdersFactoryProps) {
  const [state, setState] = useState<OrdersFactoryState>({
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

  const contextValue = useMemo<OrdersFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <OrdersFactoryContext.Provider value={contextValue}>
      {children}
      <OrdersDrawer />
      <OrdersPanel />
    </OrdersFactoryContext.Provider>
  );
}
