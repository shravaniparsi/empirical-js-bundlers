import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import TasksPanel from './TasksPanel';

interface TasksComposerState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TasksComposerContextValue {
  state: TasksComposerState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TasksComposerContext = createContext<TasksComposerContextValue | null>(null);

export function useTasksComposer() {
  const ctx = useContext(TasksComposerContext);
  if (!ctx) {
    throw new Error(`useTasksComposer must be used within a TasksComposer`);
  }
  return ctx;
}

interface TasksComposerProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TasksComposer({
  children,
  initialActive = false,
  initialLabel = 'TasksComposer',
}: TasksComposerProps) {
  const [state, setState] = useState<TasksComposerState>({
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

  const contextValue = useMemo<TasksComposerContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TasksComposerContext.Provider value={contextValue}>
      {children}
      <TasksPanel />
    </TasksComposerContext.Provider>
  );
}
