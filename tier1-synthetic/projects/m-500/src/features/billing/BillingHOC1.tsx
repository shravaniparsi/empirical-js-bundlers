import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import BillingBottomNav from './BillingBottomNav';
import ReportsTabs from '../reports/ReportsTabs';

interface BillingHOC1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface BillingHOC1ContextValue {
  state: BillingHOC1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const BillingHOC1Context = createContext<BillingHOC1ContextValue | null>(null);

export function useBillingHOC1() {
  const ctx = useContext(BillingHOC1Context);
  if (!ctx) {
    throw new Error(`useBillingHOC1 must be used within a BillingHOC1`);
  }
  return ctx;
}

interface BillingHOC1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function BillingHOC1({
  children,
  initialActive = false,
  initialLabel = 'BillingHOC1',
}: BillingHOC1Props) {
  const [state, setState] = useState<BillingHOC1State>({
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

  const contextValue = useMemo<BillingHOC1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <BillingHOC1Context.Provider value={contextValue}>
      {children}
      <BillingBottomNav />
      <ReportsTabs />
    </BillingHOC1Context.Provider>
  );
}
