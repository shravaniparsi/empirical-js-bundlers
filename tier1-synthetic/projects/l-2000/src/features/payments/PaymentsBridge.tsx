import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import PaymentsProgress from './PaymentsProgress';
import PaymentsAutocomplete from './PaymentsAutocomplete';
import PaymentsDonut from './PaymentsDonut';
import WebhooksRegistry from '../webhooks/WebhooksRegistry';

interface PaymentsBridgeState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface PaymentsBridgeContextValue {
  state: PaymentsBridgeState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const PaymentsBridgeContext = createContext<PaymentsBridgeContextValue | null>(null);

export function usePaymentsBridge() {
  const ctx = useContext(PaymentsBridgeContext);
  if (!ctx) {
    throw new Error(`usePaymentsBridge must be used within a PaymentsBridge`);
  }
  return ctx;
}

interface PaymentsBridgeProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function PaymentsBridge({
  children,
  initialActive = false,
  initialLabel = 'PaymentsBridge',
}: PaymentsBridgeProps) {
  const [state, setState] = useState<PaymentsBridgeState>({
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

  const contextValue = useMemo<PaymentsBridgeContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <PaymentsBridgeContext.Provider value={contextValue}>
      {children}
      <PaymentsProgress />
      <PaymentsAutocomplete />
      <PaymentsDonut />
      <WebhooksRegistry />
    </PaymentsBridgeContext.Provider>
  );
}
