import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AnalyticsAdapter from './AnalyticsAdapter';

interface AnalyticsWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AnalyticsWrapperContextValue {
  state: AnalyticsWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AnalyticsWrapperContext = createContext<AnalyticsWrapperContextValue | null>(null);

export function useAnalyticsWrapper() {
  const ctx = useContext(AnalyticsWrapperContext);
  if (!ctx) {
    throw new Error(`useAnalyticsWrapper must be used within a AnalyticsWrapper`);
  }
  return ctx;
}

interface AnalyticsWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AnalyticsWrapper({
  children,
  initialActive = false,
  initialLabel = 'AnalyticsWrapper',
}: AnalyticsWrapperProps) {
  const [state, setState] = useState<AnalyticsWrapperState>({
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

  const contextValue = useMemo<AnalyticsWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AnalyticsWrapperContext.Provider value={contextValue}>
      {children}
      <AnalyticsAdapter />
    </AnalyticsWrapperContext.Provider>
  );
}
