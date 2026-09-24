import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ActivityBreadcrumb from './ActivityBreadcrumb';
import ActivityRating1 from './ActivityRating1';
import ActivityTextArea from './ActivityTextArea';
import SearchDetail from '../search/SearchDetail';

interface ActivityHookState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ActivityHookContextValue {
  state: ActivityHookState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ActivityHookContext = createContext<ActivityHookContextValue | null>(null);

export function useActivityHook() {
  const ctx = useContext(ActivityHookContext);
  if (!ctx) {
    throw new Error(`useActivityHook must be used within a ActivityHook`);
  }
  return ctx;
}

interface ActivityHookProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ActivityHook({
  children,
  initialActive = false,
  initialLabel = 'ActivityHook',
}: ActivityHookProps) {
  const [state, setState] = useState<ActivityHookState>({
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

  const contextValue = useMemo<ActivityHookContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ActivityHookContext.Provider value={contextValue}>
      {children}
      <ActivityBreadcrumb />
      <ActivityRating1 />
      <ActivityTextArea />
      <SearchDetail />
    </ActivityHookContext.Provider>
  );
}
