import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ReportsGauge from './ReportsGauge';
import ReportsList from './ReportsList';
import NotificationsAreaChart from '../notifications/NotificationsAreaChart';

interface ReportsAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ReportsAdapterContextValue {
  state: ReportsAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ReportsAdapterContext = createContext<ReportsAdapterContextValue | null>(null);

export function useReportsAdapter() {
  const ctx = useContext(ReportsAdapterContext);
  if (!ctx) {
    throw new Error(`useReportsAdapter must be used within a ReportsAdapter`);
  }
  return ctx;
}

interface ReportsAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ReportsAdapter({
  children,
  initialActive = false,
  initialLabel = 'ReportsAdapter',
}: ReportsAdapterProps) {
  const [state, setState] = useState<ReportsAdapterState>({
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

  const contextValue = useMemo<ReportsAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ReportsAdapterContext.Provider value={contextValue}>
      {children}
      <ReportsGauge />
      <ReportsList />
      <NotificationsAreaChart />
    </ReportsAdapterContext.Provider>
  );
}
