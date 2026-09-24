import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import PaymentsMeter from './PaymentsMeter';
import PaymentsScatter2 from './PaymentsScatter2';

interface PaymentsAdapter1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface PaymentsAdapter1ContextValue {
  state: PaymentsAdapter1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const PaymentsAdapter1Context = createContext<PaymentsAdapter1ContextValue | null>(null);

export function usePaymentsAdapter1() {
  const ctx = useContext(PaymentsAdapter1Context);
  if (!ctx) {
    throw new Error(`usePaymentsAdapter1 must be used within a PaymentsAdapter1`);
  }
  return ctx;
}

interface PaymentsAdapter1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function PaymentsAdapter1({
  children,
  initialActive = false,
  initialLabel = 'PaymentsAdapter1',
}: PaymentsAdapter1Props) {
  const [state, setState] = useState<PaymentsAdapter1State>({
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

  const contextValue = useMemo<PaymentsAdapter1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <PaymentsAdapter1Context.Provider value={contextValue}>
      {children}
      <PaymentsMeter />
      <PaymentsScatter2 />
    </PaymentsAdapter1Context.Provider>
  );
}
