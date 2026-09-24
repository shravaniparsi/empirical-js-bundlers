import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SchedulingToggle from './SchedulingToggle';
import CatalogSuspense from '../catalog/CatalogSuspense';

interface SchedulingProviderState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SchedulingProviderContextValue {
  state: SchedulingProviderState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SchedulingProviderContext = createContext<SchedulingProviderContextValue | null>(null);

export function useSchedulingProvider() {
  const ctx = useContext(SchedulingProviderContext);
  if (!ctx) {
    throw new Error(`useSchedulingProvider must be used within a SchedulingProvider`);
  }
  return ctx;
}

interface SchedulingProviderProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SchedulingProvider({
  children,
  initialActive = false,
  initialLabel = 'SchedulingProvider',
}: SchedulingProviderProps) {
  const [state, setState] = useState<SchedulingProviderState>({
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

  const contextValue = useMemo<SchedulingProviderContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SchedulingProviderContext.Provider value={contextValue}>
      {children}
      <SchedulingToggle />
      <CatalogSuspense />
    </SchedulingProviderContext.Provider>
  );
}
