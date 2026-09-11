import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import OrdersSelect from './OrdersSelect';
import OrdersSnackbar1 from './OrdersSnackbar1';
import OrdersCard from './OrdersCard';
import BillingRangeSlider1 from '../billing/BillingRangeSlider1';

interface OrdersComposerState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface OrdersComposerContextValue {
  state: OrdersComposerState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const OrdersComposerContext = createContext<OrdersComposerContextValue | null>(null);

export function useOrdersComposer() {
  const ctx = useContext(OrdersComposerContext);
  if (!ctx) {
    throw new Error(`useOrdersComposer must be used within a OrdersComposer`);
  }
  return ctx;
}

interface OrdersComposerProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function OrdersComposer({
  children,
  initialActive = false,
  initialLabel = 'OrdersComposer',
}: OrdersComposerProps) {
  const [state, setState] = useState<OrdersComposerState>({
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

  const contextValue = useMemo<OrdersComposerContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <OrdersComposerContext.Provider value={contextValue}>
      {children}
      <OrdersSelect />
      <OrdersSnackbar1 />
      <OrdersCard />
      <BillingRangeSlider1 />
    </OrdersComposerContext.Provider>
  );
}
