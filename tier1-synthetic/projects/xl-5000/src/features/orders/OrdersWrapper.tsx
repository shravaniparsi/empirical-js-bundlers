import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import OrdersTag from './OrdersTag';
import OrdersAreaChart from './OrdersAreaChart';

interface OrdersWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface OrdersWrapperContextValue {
  state: OrdersWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const OrdersWrapperContext = createContext<OrdersWrapperContextValue | null>(null);

export function useOrdersWrapper() {
  const ctx = useContext(OrdersWrapperContext);
  if (!ctx) {
    throw new Error(`useOrdersWrapper must be used within a OrdersWrapper`);
  }
  return ctx;
}

interface OrdersWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function OrdersWrapper({
  children,
  initialActive = false,
  initialLabel = 'OrdersWrapper',
}: OrdersWrapperProps) {
  const [state, setState] = useState<OrdersWrapperState>({
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

  const contextValue = useMemo<OrdersWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <OrdersWrapperContext.Provider value={contextValue}>
      {children}
      <OrdersTag />
      <OrdersAreaChart />
    </OrdersWrapperContext.Provider>
  );
}
