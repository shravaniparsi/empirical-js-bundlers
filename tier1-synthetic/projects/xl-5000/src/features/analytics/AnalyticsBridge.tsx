import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AnalyticsToggle from './AnalyticsToggle';
import AnalyticsPolling1 from './AnalyticsPolling1';

interface AnalyticsBridgeState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AnalyticsBridgeContextValue {
  state: AnalyticsBridgeState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AnalyticsBridgeContext = createContext<AnalyticsBridgeContextValue | null>(null);

export function useAnalyticsBridge() {
  const ctx = useContext(AnalyticsBridgeContext);
  if (!ctx) {
    throw new Error(`useAnalyticsBridge must be used within a AnalyticsBridge`);
  }
  return ctx;
}

interface AnalyticsBridgeProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AnalyticsBridge({
  children,
  initialActive = false,
  initialLabel = 'AnalyticsBridge',
}: AnalyticsBridgeProps) {
  const [state, setState] = useState<AnalyticsBridgeState>({
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

  const contextValue = useMemo<AnalyticsBridgeContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AnalyticsBridgeContext.Provider value={contextValue}>
      {children}
      <AnalyticsToggle />
      <AnalyticsPolling1 />
    </AnalyticsBridgeContext.Provider>
  );
}
