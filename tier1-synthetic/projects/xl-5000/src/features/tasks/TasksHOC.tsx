import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import TasksSticky from './TasksSticky';

interface TasksHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TasksHOCContextValue {
  state: TasksHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TasksHOCContext = createContext<TasksHOCContextValue | null>(null);

export function useTasksHOC() {
  const ctx = useContext(TasksHOCContext);
  if (!ctx) {
    throw new Error(`useTasksHOC must be used within a TasksHOC`);
  }
  return ctx;
}

interface TasksHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TasksHOC({
  children,
  initialActive = false,
  initialLabel = 'TasksHOC',
}: TasksHOCProps) {
  const [state, setState] = useState<TasksHOCState>({
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

  const contextValue = useMemo<TasksHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TasksHOCContext.Provider value={contextValue}>
      {children}
      <TasksSticky />
    </TasksHOCContext.Provider>
  );
}
