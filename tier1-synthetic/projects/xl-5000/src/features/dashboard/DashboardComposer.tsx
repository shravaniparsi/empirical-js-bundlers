import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import DashboardConfirm from './DashboardConfirm';
import DashboardInfiniteScroll1 from './DashboardInfiniteScroll1';
import DashboardList from './DashboardList';
import PaymentsDetail from '../payments/PaymentsDetail';

interface DashboardComposerState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface DashboardComposerContextValue {
  state: DashboardComposerState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const DashboardComposerContext = createContext<DashboardComposerContextValue | null>(null);

export function useDashboardComposer() {
  const ctx = useContext(DashboardComposerContext);
  if (!ctx) {
    throw new Error(`useDashboardComposer must be used within a DashboardComposer`);
  }
  return ctx;
}

interface DashboardComposerProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function DashboardComposer({
  children,
  initialActive = false,
  initialLabel = 'DashboardComposer',
}: DashboardComposerProps) {
  const [state, setState] = useState<DashboardComposerState>({
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

  const contextValue = useMemo<DashboardComposerContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <DashboardComposerContext.Provider value={contextValue}>
      {children}
      <DashboardConfirm />
      <DashboardInfiniteScroll1 />
      <DashboardList />
      <PaymentsDetail />
    </DashboardComposerContext.Provider>
  );
}
