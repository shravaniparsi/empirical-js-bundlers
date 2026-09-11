import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import BillingScatter from './BillingScatter';

interface BillingContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface BillingContextContextValue {
  state: BillingContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const BillingContextContext = createContext<BillingContextContextValue | null>(null);

export function useBillingContext() {
  const ctx = useContext(BillingContextContext);
  if (!ctx) {
    throw new Error(`useBillingContext must be used within a BillingContext`);
  }
  return ctx;
}

interface BillingContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function BillingContext({
  children,
  initialActive = false,
  initialLabel = 'BillingContext',
}: BillingContextProps) {
  const [state, setState] = useState<BillingContextState>({
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

  const contextValue = useMemo<BillingContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <BillingContextContext.Provider value={contextValue}>
      {children}
      <BillingScatter />
    </BillingContextContext.Provider>
  );
}
