import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import PaymentsRating from './PaymentsRating';

interface PaymentsContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface PaymentsContextContextValue {
  state: PaymentsContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const PaymentsContextContext = createContext<PaymentsContextContextValue | null>(null);

export function usePaymentsContext() {
  const ctx = useContext(PaymentsContextContext);
  if (!ctx) {
    throw new Error(`usePaymentsContext must be used within a PaymentsContext`);
  }
  return ctx;
}

interface PaymentsContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function PaymentsContext({
  children,
  initialActive = false,
  initialLabel = 'PaymentsContext',
}: PaymentsContextProps) {
  const [state, setState] = useState<PaymentsContextState>({
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

  const contextValue = useMemo<PaymentsContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <PaymentsContextContext.Provider value={contextValue}>
      {children}
      <PaymentsRating />
    </PaymentsContextContext.Provider>
  );
}
