import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import BillingSnackbar1 from './BillingSnackbar1';
import BillingDrawer1 from './BillingDrawer1';

interface BillingHook1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface BillingHook1ContextValue {
  state: BillingHook1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const BillingHook1Context = createContext<BillingHook1ContextValue | null>(null);

export function useBillingHook1() {
  const ctx = useContext(BillingHook1Context);
  if (!ctx) {
    throw new Error(`useBillingHook1 must be used within a BillingHook1`);
  }
  return ctx;
}

interface BillingHook1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function BillingHook1({
  children,
  initialActive = false,
  initialLabel = 'BillingHook1',
}: BillingHook1Props) {
  const [state, setState] = useState<BillingHook1State>({
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

  const contextValue = useMemo<BillingHook1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <BillingHook1Context.Provider value={contextValue}>
      {children}
      <BillingSnackbar1 />
      <BillingDrawer1 />
    </BillingHook1Context.Provider>
  );
}
