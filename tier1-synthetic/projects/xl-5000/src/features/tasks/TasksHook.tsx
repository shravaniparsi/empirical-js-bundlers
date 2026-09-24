import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import TasksMeter1 from './TasksMeter1';

interface TasksHookState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TasksHookContextValue {
  state: TasksHookState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TasksHookContext = createContext<TasksHookContextValue | null>(null);

export function useTasksHook() {
  const ctx = useContext(TasksHookContext);
  if (!ctx) {
    throw new Error(`useTasksHook must be used within a TasksHook`);
  }
  return ctx;
}

interface TasksHookProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TasksHook({
  children,
  initialActive = false,
  initialLabel = 'TasksHook',
}: TasksHookProps) {
  const [state, setState] = useState<TasksHookState>({
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

  const contextValue = useMemo<TasksHookContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TasksHookContext.Provider value={contextValue}>
      {children}
      <TasksMeter1 />
    </TasksHookContext.Provider>
  );
}
