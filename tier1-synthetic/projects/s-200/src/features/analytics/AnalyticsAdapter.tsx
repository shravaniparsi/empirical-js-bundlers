import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AnalyticsAvatar from './AnalyticsAvatar';

interface AnalyticsAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AnalyticsAdapterContextValue {
  state: AnalyticsAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AnalyticsAdapterContext = createContext<AnalyticsAdapterContextValue | null>(null);

export function useAnalyticsAdapter() {
  const ctx = useContext(AnalyticsAdapterContext);
  if (!ctx) {
    throw new Error(`useAnalyticsAdapter must be used within a AnalyticsAdapter`);
  }
  return ctx;
}

interface AnalyticsAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AnalyticsAdapter({
  children,
  initialActive = false,
  initialLabel = 'AnalyticsAdapter',
}: AnalyticsAdapterProps) {
  const [state, setState] = useState<AnalyticsAdapterState>({
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

  const contextValue = useMemo<AnalyticsAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AnalyticsAdapterContext.Provider value={contextValue}>
      {children}
      <AnalyticsAvatar />
    </AnalyticsAdapterContext.Provider>
  );
}
