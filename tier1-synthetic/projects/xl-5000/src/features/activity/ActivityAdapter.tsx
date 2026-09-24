import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ActivityPrefetch from './ActivityPrefetch';
import ActivityHook from './ActivityHook';
import ActivityRank from './ActivityRank';

interface ActivityAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ActivityAdapterContextValue {
  state: ActivityAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ActivityAdapterContext = createContext<ActivityAdapterContextValue | null>(null);

export function useActivityAdapter() {
  const ctx = useContext(ActivityAdapterContext);
  if (!ctx) {
    throw new Error(`useActivityAdapter must be used within a ActivityAdapter`);
  }
  return ctx;
}

interface ActivityAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ActivityAdapter({
  children,
  initialActive = false,
  initialLabel = 'ActivityAdapter',
}: ActivityAdapterProps) {
  const [state, setState] = useState<ActivityAdapterState>({
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

  const contextValue = useMemo<ActivityAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ActivityAdapterContext.Provider value={contextValue}>
      {children}
      <ActivityPrefetch />
      <ActivityHook />
      <ActivityRank />
    </ActivityAdapterContext.Provider>
  );
}
