import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ActivityBarChart from './ActivityBarChart';

interface ActivityFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ActivityFactoryContextValue {
  state: ActivityFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ActivityFactoryContext = createContext<ActivityFactoryContextValue | null>(null);

export function useActivityFactory() {
  const ctx = useContext(ActivityFactoryContext);
  if (!ctx) {
    throw new Error(`useActivityFactory must be used within a ActivityFactory`);
  }
  return ctx;
}

interface ActivityFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ActivityFactory({
  children,
  initialActive = false,
  initialLabel = 'ActivityFactory',
}: ActivityFactoryProps) {
  const [state, setState] = useState<ActivityFactoryState>({
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

  const contextValue = useMemo<ActivityFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ActivityFactoryContext.Provider value={contextValue}>
      {children}
      <ActivityBarChart />
    </ActivityFactoryContext.Provider>
  );
}
