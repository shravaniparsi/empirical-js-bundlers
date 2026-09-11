import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import OrdersStepper from './OrdersStepper';

interface OrdersFactory1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface OrdersFactory1ContextValue {
  state: OrdersFactory1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const OrdersFactory1Context = createContext<OrdersFactory1ContextValue | null>(null);

export function useOrdersFactory1() {
  const ctx = useContext(OrdersFactory1Context);
  if (!ctx) {
    throw new Error(`useOrdersFactory1 must be used within a OrdersFactory1`);
  }
  return ctx;
}

interface OrdersFactory1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function OrdersFactory1({
  children,
  initialActive = false,
  initialLabel = 'OrdersFactory1',
}: OrdersFactory1Props) {
  const [state, setState] = useState<OrdersFactory1State>({
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

  const contextValue = useMemo<OrdersFactory1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <OrdersFactory1Context.Provider value={contextValue}>
      {children}
      <OrdersStepper />
    </OrdersFactory1Context.Provider>
  );
}
