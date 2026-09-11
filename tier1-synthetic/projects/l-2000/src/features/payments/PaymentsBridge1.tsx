import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import PaymentsGrid from './PaymentsGrid';

interface PaymentsBridge1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface PaymentsBridge1ContextValue {
  state: PaymentsBridge1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const PaymentsBridge1Context = createContext<PaymentsBridge1ContextValue | null>(null);

export function usePaymentsBridge1() {
  const ctx = useContext(PaymentsBridge1Context);
  if (!ctx) {
    throw new Error(`usePaymentsBridge1 must be used within a PaymentsBridge1`);
  }
  return ctx;
}

interface PaymentsBridge1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function PaymentsBridge1({
  children,
  initialActive = false,
  initialLabel = 'PaymentsBridge1',
}: PaymentsBridge1Props) {
  const [state, setState] = useState<PaymentsBridge1State>({
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

  const contextValue = useMemo<PaymentsBridge1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <PaymentsBridge1Context.Provider value={contextValue}>
      {children}
      <PaymentsGrid />
    </PaymentsBridge1Context.Provider>
  );
}
