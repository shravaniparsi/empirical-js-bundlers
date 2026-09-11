import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface OrdersRegistryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface OrdersRegistryContextValue {
  state: OrdersRegistryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const OrdersRegistryContext = createContext<OrdersRegistryContextValue | null>(null);

export function useOrdersRegistry() {
  const ctx = useContext(OrdersRegistryContext);
  if (!ctx) {
    throw new Error(`useOrdersRegistry must be used within a OrdersRegistry`);
  }
  return ctx;
}

interface OrdersRegistryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function OrdersRegistry({
  children,
  initialActive = false,
  initialLabel = 'OrdersRegistry',
}: OrdersRegistryProps) {
  const [state, setState] = useState<OrdersRegistryState>({
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

  const contextValue = useMemo<OrdersRegistryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <OrdersRegistryContext.Provider value={contextValue}>
      {children}

    </OrdersRegistryContext.Provider>
  );
}
