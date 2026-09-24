import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import TasksErrorBoundary from './TasksErrorBoundary';

interface TasksComposer1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TasksComposer1ContextValue {
  state: TasksComposer1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TasksComposer1Context = createContext<TasksComposer1ContextValue | null>(null);

export function useTasksComposer1() {
  const ctx = useContext(TasksComposer1Context);
  if (!ctx) {
    throw new Error(`useTasksComposer1 must be used within a TasksComposer1`);
  }
  return ctx;
}

interface TasksComposer1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TasksComposer1({
  children,
  initialActive = false,
  initialLabel = 'TasksComposer1',
}: TasksComposer1Props) {
  const [state, setState] = useState<TasksComposer1State>({
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

  const contextValue = useMemo<TasksComposer1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TasksComposer1Context.Provider value={contextValue}>
      {children}
      <TasksErrorBoundary />
    </TasksComposer1Context.Provider>
  );
}
