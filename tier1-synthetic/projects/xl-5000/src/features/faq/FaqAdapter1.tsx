import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import FaqResponsive from './FaqResponsive';
import FaqRank from './FaqRank';
import NotificationsHeatmap1 from '../notifications/NotificationsHeatmap1';
import ActivityLabel from '../activity/ActivityLabel';

interface FaqAdapter1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface FaqAdapter1ContextValue {
  state: FaqAdapter1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const FaqAdapter1Context = createContext<FaqAdapter1ContextValue | null>(null);

export function useFaqAdapter1() {
  const ctx = useContext(FaqAdapter1Context);
  if (!ctx) {
    throw new Error(`useFaqAdapter1 must be used within a FaqAdapter1`);
  }
  return ctx;
}

interface FaqAdapter1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function FaqAdapter1({
  children,
  initialActive = false,
  initialLabel = 'FaqAdapter1',
}: FaqAdapter1Props) {
  const [state, setState] = useState<FaqAdapter1State>({
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

  const contextValue = useMemo<FaqAdapter1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <FaqAdapter1Context.Provider value={contextValue}>
      {children}
      <FaqResponsive />
      <FaqRank />
      <NotificationsHeatmap1 />
      <ActivityLabel />
    </FaqAdapter1Context.Provider>
  );
}
