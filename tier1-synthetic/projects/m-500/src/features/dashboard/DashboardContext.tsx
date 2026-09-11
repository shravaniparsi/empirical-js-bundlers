import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import DashboardSelect1 from './DashboardSelect1';

interface DashboardContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface DashboardContextContextValue {
  state: DashboardContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const DashboardContextContext = createContext<DashboardContextContextValue | null>(null);

export function useDashboardContext() {
  const ctx = useContext(DashboardContextContext);
  if (!ctx) {
    throw new Error(`useDashboardContext must be used within a DashboardContext`);
  }
  return ctx;
}

interface DashboardContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function DashboardContext({
  children,
  initialActive = false,
  initialLabel = 'DashboardContext',
}: DashboardContextProps) {
  const [state, setState] = useState<DashboardContextState>({
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

  const contextValue = useMemo<DashboardContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <DashboardContextContext.Provider value={contextValue}>
      {children}
      <DashboardSelect1 />
    </DashboardContextContext.Provider>
  );
}
