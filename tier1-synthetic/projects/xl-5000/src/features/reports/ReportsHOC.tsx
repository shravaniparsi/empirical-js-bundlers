import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ReportsPieChart3 from './ReportsPieChart3';

interface ReportsHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ReportsHOCContextValue {
  state: ReportsHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ReportsHOCContext = createContext<ReportsHOCContextValue | null>(null);

export function useReportsHOC() {
  const ctx = useContext(ReportsHOCContext);
  if (!ctx) {
    throw new Error(`useReportsHOC must be used within a ReportsHOC`);
  }
  return ctx;
}

interface ReportsHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ReportsHOC({
  children,
  initialActive = false,
  initialLabel = 'ReportsHOC',
}: ReportsHOCProps) {
  const [state, setState] = useState<ReportsHOCState>({
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

  const contextValue = useMemo<ReportsHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ReportsHOCContext.Provider value={contextValue}>
      {children}
      <ReportsPieChart3 />
    </ReportsHOCContext.Provider>
  );
}
