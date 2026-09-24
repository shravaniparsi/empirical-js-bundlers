import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import PaymentsRating from './PaymentsRating';

interface PaymentsAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface PaymentsAdapterContextValue {
  state: PaymentsAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const PaymentsAdapterContext = createContext<PaymentsAdapterContextValue | null>(null);

export function usePaymentsAdapter() {
  const ctx = useContext(PaymentsAdapterContext);
  if (!ctx) {
    throw new Error(`usePaymentsAdapter must be used within a PaymentsAdapter`);
  }
  return ctx;
}

interface PaymentsAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function PaymentsAdapter({
  children,
  initialActive = false,
  initialLabel = 'PaymentsAdapter',
}: PaymentsAdapterProps) {
  const [state, setState] = useState<PaymentsAdapterState>({
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

  const contextValue = useMemo<PaymentsAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <PaymentsAdapterContext.Provider value={contextValue}>
      {children}
      <PaymentsRating />
    </PaymentsAdapterContext.Provider>
  );
}
