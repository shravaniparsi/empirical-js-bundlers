import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import PaymentsSnackbar from './PaymentsSnackbar';
import PaymentsGauge from './PaymentsGauge';
import PaymentsSplit1 from './PaymentsSplit1';
import BillingThumbnail from '../billing/BillingThumbnail';

interface PaymentsRegistryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface PaymentsRegistryContextValue {
  state: PaymentsRegistryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const PaymentsRegistryContext = createContext<PaymentsRegistryContextValue | null>(null);

export function usePaymentsRegistry() {
  const ctx = useContext(PaymentsRegistryContext);
  if (!ctx) {
    throw new Error(`usePaymentsRegistry must be used within a PaymentsRegistry`);
  }
  return ctx;
}

interface PaymentsRegistryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function PaymentsRegistry({
  children,
  initialActive = false,
  initialLabel = 'PaymentsRegistry',
}: PaymentsRegistryProps) {
  const [state, setState] = useState<PaymentsRegistryState>({
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

  const contextValue = useMemo<PaymentsRegistryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <PaymentsRegistryContext.Provider value={contextValue}>
      {children}
      <PaymentsSnackbar />
      <PaymentsGauge />
      <PaymentsSplit1 />
      <BillingThumbnail />
    </PaymentsRegistryContext.Provider>
  );
}
