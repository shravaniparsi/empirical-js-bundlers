import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import DashboardSkeleton from './DashboardSkeleton';
import DashboardScroll from './DashboardScroll';
import DocumentsBottomNav from '../documents/DocumentsBottomNav';

interface DashboardAdapter1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface DashboardAdapter1ContextValue {
  state: DashboardAdapter1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const DashboardAdapter1Context = createContext<DashboardAdapter1ContextValue | null>(null);

export function useDashboardAdapter1() {
  const ctx = useContext(DashboardAdapter1Context);
  if (!ctx) {
    throw new Error(`useDashboardAdapter1 must be used within a DashboardAdapter1`);
  }
  return ctx;
}

interface DashboardAdapter1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function DashboardAdapter1({
  children,
  initialActive = false,
  initialLabel = 'DashboardAdapter1',
}: DashboardAdapter1Props) {
  const [state, setState] = useState<DashboardAdapter1State>({
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

  const contextValue = useMemo<DashboardAdapter1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <DashboardAdapter1Context.Provider value={contextValue}>
      {children}
      <DashboardSkeleton />
      <DashboardScroll />
      <DocumentsBottomNav />
    </DashboardAdapter1Context.Provider>
  );
}
