import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import OrdersTextArea2 from './OrdersTextArea2';

interface OrdersHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface OrdersHOCContextValue {
  state: OrdersHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const OrdersHOCContext = createContext<OrdersHOCContextValue | null>(null);

export function useOrdersHOC() {
  const ctx = useContext(OrdersHOCContext);
  if (!ctx) {
    throw new Error(`useOrdersHOC must be used within a OrdersHOC`);
  }
  return ctx;
}

interface OrdersHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function OrdersHOC({
  children,
  initialActive = false,
  initialLabel = 'OrdersHOC',
}: OrdersHOCProps) {
  const [state, setState] = useState<OrdersHOCState>({
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

  const contextValue = useMemo<OrdersHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <OrdersHOCContext.Provider value={contextValue}>
      {children}
      <OrdersTextArea2 />
    </OrdersHOCContext.Provider>
  );
}
