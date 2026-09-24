import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ActivityProgress from './ActivityProgress';
import ActivityRank from './ActivityRank';

interface ActivityWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ActivityWrapperContextValue {
  state: ActivityWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ActivityWrapperContext = createContext<ActivityWrapperContextValue | null>(null);

export function useActivityWrapper() {
  const ctx = useContext(ActivityWrapperContext);
  if (!ctx) {
    throw new Error(`useActivityWrapper must be used within a ActivityWrapper`);
  }
  return ctx;
}

interface ActivityWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ActivityWrapper({
  children,
  initialActive = false,
  initialLabel = 'ActivityWrapper',
}: ActivityWrapperProps) {
  const [state, setState] = useState<ActivityWrapperState>({
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

  const contextValue = useMemo<ActivityWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ActivityWrapperContext.Provider value={contextValue}>
      {children}
      <ActivityProgress />
      <ActivityRank />
    </ActivityWrapperContext.Provider>
  );
}
