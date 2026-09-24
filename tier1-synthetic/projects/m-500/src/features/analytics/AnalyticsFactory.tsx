import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AnalyticsHeatmap from './AnalyticsHeatmap';

interface AnalyticsFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AnalyticsFactoryContextValue {
  state: AnalyticsFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AnalyticsFactoryContext = createContext<AnalyticsFactoryContextValue | null>(null);

export function useAnalyticsFactory() {
  const ctx = useContext(AnalyticsFactoryContext);
  if (!ctx) {
    throw new Error(`useAnalyticsFactory must be used within a AnalyticsFactory`);
  }
  return ctx;
}

interface AnalyticsFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AnalyticsFactory({
  children,
  initialActive = false,
  initialLabel = 'AnalyticsFactory',
}: AnalyticsFactoryProps) {
  const [state, setState] = useState<AnalyticsFactoryState>({
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

  const contextValue = useMemo<AnalyticsFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AnalyticsFactoryContext.Provider value={contextValue}>
      {children}
      <AnalyticsHeatmap />
    </AnalyticsFactoryContext.Provider>
  );
}
