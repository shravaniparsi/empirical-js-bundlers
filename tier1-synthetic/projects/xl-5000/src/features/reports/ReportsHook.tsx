import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ReportsProgress from './ReportsProgress';
import ReportsTable1 from './ReportsTable1';

interface ReportsHookState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ReportsHookContextValue {
  state: ReportsHookState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ReportsHookContext = createContext<ReportsHookContextValue | null>(null);

export function useReportsHook() {
  const ctx = useContext(ReportsHookContext);
  if (!ctx) {
    throw new Error(`useReportsHook must be used within a ReportsHook`);
  }
  return ctx;
}

interface ReportsHookProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ReportsHook({
  children,
  initialActive = false,
  initialLabel = 'ReportsHook',
}: ReportsHookProps) {
  const [state, setState] = useState<ReportsHookState>({
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

  const contextValue = useMemo<ReportsHookContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ReportsHookContext.Provider value={contextValue}>
      {children}
      <ReportsProgress />
      <ReportsTable1 />
    </ReportsHookContext.Provider>
  );
}
