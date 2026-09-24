import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import DashboardMeter1 from './DashboardMeter1';
import DashboardFunnel from './DashboardFunnel';

interface DashboardFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface DashboardFactoryContextValue {
  state: DashboardFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const DashboardFactoryContext = createContext<DashboardFactoryContextValue | null>(null);

export function useDashboardFactory() {
  const ctx = useContext(DashboardFactoryContext);
  if (!ctx) {
    throw new Error(`useDashboardFactory must be used within a DashboardFactory`);
  }
  return ctx;
}

interface DashboardFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function DashboardFactory({
  children,
  initialActive = false,
  initialLabel = 'DashboardFactory',
}: DashboardFactoryProps) {
  const [state, setState] = useState<DashboardFactoryState>({
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

  const contextValue = useMemo<DashboardFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <DashboardFactoryContext.Provider value={contextValue}>
      {children}
      <DashboardMeter1 />
      <DashboardFunnel />
    </DashboardFactoryContext.Provider>
  );
}
