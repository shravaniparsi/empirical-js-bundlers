import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AnalyticsSummary3 from './AnalyticsSummary3';
import AnalyticsSuspense from './AnalyticsSuspense';
import OrdersScore1 from '../orders/OrdersScore1';

interface AnalyticsProvider1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AnalyticsProvider1ContextValue {
  state: AnalyticsProvider1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AnalyticsProvider1Context = createContext<AnalyticsProvider1ContextValue | null>(null);

export function useAnalyticsProvider1() {
  const ctx = useContext(AnalyticsProvider1Context);
  if (!ctx) {
    throw new Error(`useAnalyticsProvider1 must be used within a AnalyticsProvider1`);
  }
  return ctx;
}

interface AnalyticsProvider1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AnalyticsProvider1({
  children,
  initialActive = false,
  initialLabel = 'AnalyticsProvider1',
}: AnalyticsProvider1Props) {
  const [state, setState] = useState<AnalyticsProvider1State>({
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

  const contextValue = useMemo<AnalyticsProvider1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AnalyticsProvider1Context.Provider value={contextValue}>
      {children}
      <AnalyticsSummary3 />
      <AnalyticsSuspense />
      <OrdersScore1 />
    </AnalyticsProvider1Context.Provider>
  );
}
