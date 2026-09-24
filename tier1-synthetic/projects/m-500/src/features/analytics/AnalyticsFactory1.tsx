import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AnalyticsDrawer from './AnalyticsDrawer';

interface AnalyticsFactory1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AnalyticsFactory1ContextValue {
  state: AnalyticsFactory1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AnalyticsFactory1Context = createContext<AnalyticsFactory1ContextValue | null>(null);

export function useAnalyticsFactory1() {
  const ctx = useContext(AnalyticsFactory1Context);
  if (!ctx) {
    throw new Error(`useAnalyticsFactory1 must be used within a AnalyticsFactory1`);
  }
  return ctx;
}

interface AnalyticsFactory1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AnalyticsFactory1({
  children,
  initialActive = false,
  initialLabel = 'AnalyticsFactory1',
}: AnalyticsFactory1Props) {
  const [state, setState] = useState<AnalyticsFactory1State>({
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

  const contextValue = useMemo<AnalyticsFactory1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AnalyticsFactory1Context.Provider value={contextValue}>
      {children}
      <AnalyticsDrawer />
    </AnalyticsFactory1Context.Provider>
  );
}
