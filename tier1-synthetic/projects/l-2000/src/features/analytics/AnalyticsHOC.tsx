import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AnalyticsMeter from './AnalyticsMeter';
import AnalyticsAccordion from './AnalyticsAccordion';
import ShippingTable from '../shipping/ShippingTable';
import DashboardProgress from '../dashboard/DashboardProgress';

interface AnalyticsHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AnalyticsHOCContextValue {
  state: AnalyticsHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AnalyticsHOCContext = createContext<AnalyticsHOCContextValue | null>(null);

export function useAnalyticsHOC() {
  const ctx = useContext(AnalyticsHOCContext);
  if (!ctx) {
    throw new Error(`useAnalyticsHOC must be used within a AnalyticsHOC`);
  }
  return ctx;
}

interface AnalyticsHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AnalyticsHOC({
  children,
  initialActive = false,
  initialLabel = 'AnalyticsHOC',
}: AnalyticsHOCProps) {
  const [state, setState] = useState<AnalyticsHOCState>({
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

  const contextValue = useMemo<AnalyticsHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AnalyticsHOCContext.Provider value={contextValue}>
      {children}
      <AnalyticsMeter />
      <AnalyticsAccordion />
      <ShippingTable />
      <DashboardProgress />
    </AnalyticsHOCContext.Provider>
  );
}
