import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import OrdersTimeline from './OrdersTimeline';
import OrdersSnackbar from './OrdersSnackbar';

interface OrdersHOC1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface OrdersHOC1ContextValue {
  state: OrdersHOC1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const OrdersHOC1Context = createContext<OrdersHOC1ContextValue | null>(null);

export function useOrdersHOC1() {
  const ctx = useContext(OrdersHOC1Context);
  if (!ctx) {
    throw new Error(`useOrdersHOC1 must be used within a OrdersHOC1`);
  }
  return ctx;
}

interface OrdersHOC1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function OrdersHOC1({
  children,
  initialActive = false,
  initialLabel = 'OrdersHOC1',
}: OrdersHOC1Props) {
  const [state, setState] = useState<OrdersHOC1State>({
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

  const contextValue = useMemo<OrdersHOC1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <OrdersHOC1Context.Provider value={contextValue}>
      {children}
      <OrdersTimeline />
      <OrdersSnackbar />
    </OrdersHOC1Context.Provider>
  );
}
