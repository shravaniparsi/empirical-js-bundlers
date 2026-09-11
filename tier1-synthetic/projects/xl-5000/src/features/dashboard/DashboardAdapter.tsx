import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import DashboardCard from './DashboardCard';
import DashboardSummary1 from './DashboardSummary1';
import DashboardRangeSlider from './DashboardRangeSlider';

interface DashboardAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface DashboardAdapterContextValue {
  state: DashboardAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const DashboardAdapterContext = createContext<DashboardAdapterContextValue | null>(null);

export function useDashboardAdapter() {
  const ctx = useContext(DashboardAdapterContext);
  if (!ctx) {
    throw new Error(`useDashboardAdapter must be used within a DashboardAdapter`);
  }
  return ctx;
}

interface DashboardAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function DashboardAdapter({
  children,
  initialActive = false,
  initialLabel = 'DashboardAdapter',
}: DashboardAdapterProps) {
  const [state, setState] = useState<DashboardAdapterState>({
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

  const contextValue = useMemo<DashboardAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <DashboardAdapterContext.Provider value={contextValue}>
      {children}
      <DashboardCard />
      <DashboardSummary1 />
      <DashboardRangeSlider />
    </DashboardAdapterContext.Provider>
  );
}
