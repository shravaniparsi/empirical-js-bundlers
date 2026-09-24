import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ReportsPopover1 from './ReportsPopover1';
import ReportsThumbnail1 from './ReportsThumbnail1';
import ReportsFooter from './ReportsFooter';

interface ReportsBridge1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ReportsBridge1ContextValue {
  state: ReportsBridge1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ReportsBridge1Context = createContext<ReportsBridge1ContextValue | null>(null);

export function useReportsBridge1() {
  const ctx = useContext(ReportsBridge1Context);
  if (!ctx) {
    throw new Error(`useReportsBridge1 must be used within a ReportsBridge1`);
  }
  return ctx;
}

interface ReportsBridge1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ReportsBridge1({
  children,
  initialActive = false,
  initialLabel = 'ReportsBridge1',
}: ReportsBridge1Props) {
  const [state, setState] = useState<ReportsBridge1State>({
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

  const contextValue = useMemo<ReportsBridge1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ReportsBridge1Context.Provider value={contextValue}>
      {children}
      <ReportsPopover1 />
      <ReportsThumbnail1 />
      <ReportsFooter />
    </ReportsBridge1Context.Provider>
  );
}
