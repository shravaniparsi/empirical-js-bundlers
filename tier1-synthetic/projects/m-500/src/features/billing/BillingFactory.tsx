import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import BillingConfirm from './BillingConfirm';
import BillingSnackbar from './BillingSnackbar';

interface BillingFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface BillingFactoryContextValue {
  state: BillingFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const BillingFactoryContext = createContext<BillingFactoryContextValue | null>(null);

export function useBillingFactory() {
  const ctx = useContext(BillingFactoryContext);
  if (!ctx) {
    throw new Error(`useBillingFactory must be used within a BillingFactory`);
  }
  return ctx;
}

interface BillingFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function BillingFactory({
  children,
  initialActive = false,
  initialLabel = 'BillingFactory',
}: BillingFactoryProps) {
  const [state, setState] = useState<BillingFactoryState>({
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

  const contextValue = useMemo<BillingFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <BillingFactoryContext.Provider value={contextValue}>
      {children}
      <BillingConfirm />
      <BillingSnackbar />
    </BillingFactoryContext.Provider>
  );
}
