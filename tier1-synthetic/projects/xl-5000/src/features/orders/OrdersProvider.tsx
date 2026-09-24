import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import OrdersDatePicker from './OrdersDatePicker';
import CatalogPaginated from '../catalog/CatalogPaginated';

interface OrdersProviderState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface OrdersProviderContextValue {
  state: OrdersProviderState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const OrdersProviderContext = createContext<OrdersProviderContextValue | null>(null);

export function useOrdersProvider() {
  const ctx = useContext(OrdersProviderContext);
  if (!ctx) {
    throw new Error(`useOrdersProvider must be used within a OrdersProvider`);
  }
  return ctx;
}

interface OrdersProviderProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function OrdersProvider({
  children,
  initialActive = false,
  initialLabel = 'OrdersProvider',
}: OrdersProviderProps) {
  const [state, setState] = useState<OrdersProviderState>({
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

  const contextValue = useMemo<OrdersProviderContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <OrdersProviderContext.Provider value={contextValue}>
      {children}
      <OrdersDatePicker />
      <CatalogPaginated />
    </OrdersProviderContext.Provider>
  );
}
