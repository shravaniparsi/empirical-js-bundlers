import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import PaymentsCheckbox from './PaymentsCheckbox';

interface PaymentsHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface PaymentsHOCContextValue {
  state: PaymentsHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const PaymentsHOCContext = createContext<PaymentsHOCContextValue | null>(null);

export function usePaymentsHOC() {
  const ctx = useContext(PaymentsHOCContext);
  if (!ctx) {
    throw new Error(`usePaymentsHOC must be used within a PaymentsHOC`);
  }
  return ctx;
}

interface PaymentsHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function PaymentsHOC({
  children,
  initialActive = false,
  initialLabel = 'PaymentsHOC',
}: PaymentsHOCProps) {
  const [state, setState] = useState<PaymentsHOCState>({
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

  const contextValue = useMemo<PaymentsHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <PaymentsHOCContext.Provider value={contextValue}>
      {children}
      <PaymentsCheckbox />
    </PaymentsHOCContext.Provider>
  );
}
