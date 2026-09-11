import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AnalyticsPrefetch1 from './AnalyticsPrefetch1';
import ThemesSticky1 from '../themes/ThemesSticky1';

interface AnalyticsProviderState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AnalyticsProviderContextValue {
  state: AnalyticsProviderState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AnalyticsProviderContext = createContext<AnalyticsProviderContextValue | null>(null);

export function useAnalyticsProvider() {
  const ctx = useContext(AnalyticsProviderContext);
  if (!ctx) {
    throw new Error(`useAnalyticsProvider must be used within a AnalyticsProvider`);
  }
  return ctx;
}

interface AnalyticsProviderProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AnalyticsProvider({
  children,
  initialActive = false,
  initialLabel = 'AnalyticsProvider',
}: AnalyticsProviderProps) {
  const [state, setState] = useState<AnalyticsProviderState>({
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

  const contextValue = useMemo<AnalyticsProviderContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AnalyticsProviderContext.Provider value={contextValue}>
      {children}
      <AnalyticsPrefetch1 />
      <ThemesSticky1 />
    </AnalyticsProviderContext.Provider>
  );
}
