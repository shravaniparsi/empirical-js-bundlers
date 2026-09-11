import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface OrdersAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface OrdersAdapterContextValue {
  state: OrdersAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const OrdersAdapterContext = createContext<OrdersAdapterContextValue | null>(null);

export function useOrdersAdapter() {
  const ctx = useContext(OrdersAdapterContext);
  if (!ctx) {
    throw new Error(`useOrdersAdapter must be used within a OrdersAdapter`);
  }
  return ctx;
}

interface OrdersAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function OrdersAdapter({
  children,
  initialActive = false,
  initialLabel = 'OrdersAdapter',
}: OrdersAdapterProps) {
  const [state, setState] = useState<OrdersAdapterState>({
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

  const contextValue = useMemo<OrdersAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <OrdersAdapterContext.Provider value={contextValue}>
      {children}

    </OrdersAdapterContext.Provider>
  );
}
