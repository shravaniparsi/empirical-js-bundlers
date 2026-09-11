import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ReportsTag from './ReportsTag';
import ReportsSpacer from './ReportsSpacer';
import AuthFooter from '../auth/AuthFooter';

interface ReportsContext1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ReportsContext1ContextValue {
  state: ReportsContext1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ReportsContext1Context = createContext<ReportsContext1ContextValue | null>(null);

export function useReportsContext1() {
  const ctx = useContext(ReportsContext1Context);
  if (!ctx) {
    throw new Error(`useReportsContext1 must be used within a ReportsContext1`);
  }
  return ctx;
}

interface ReportsContext1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ReportsContext1({
  children,
  initialActive = false,
  initialLabel = 'ReportsContext1',
}: ReportsContext1Props) {
  const [state, setState] = useState<ReportsContext1State>({
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

  const contextValue = useMemo<ReportsContext1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ReportsContext1Context.Provider value={contextValue}>
      {children}
      <ReportsTag />
      <ReportsSpacer />
      <AuthFooter />
    </ReportsContext1Context.Provider>
  );
}
