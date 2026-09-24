import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface PaymentsProviderState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface PaymentsProviderContextValue {
  state: PaymentsProviderState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const PaymentsProviderContext = createContext<PaymentsProviderContextValue | null>(null);

export function usePaymentsProvider() {
  const ctx = useContext(PaymentsProviderContext);
  if (!ctx) {
    throw new Error(`usePaymentsProvider must be used within a PaymentsProvider`);
  }
  return ctx;
}

interface PaymentsProviderProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function PaymentsProvider({
  children,
  initialActive = false,
  initialLabel = 'PaymentsProvider',
}: PaymentsProviderProps) {
  const [state, setState] = useState<PaymentsProviderState>({
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

  const contextValue = useMemo<PaymentsProviderContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <PaymentsProviderContext.Provider value={contextValue}>
      {children}

    </PaymentsProviderContext.Provider>
  );
}
