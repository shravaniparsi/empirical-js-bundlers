import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import WorkflowsComposer from './WorkflowsComposer';

interface WorkflowsHookState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface WorkflowsHookContextValue {
  state: WorkflowsHookState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const WorkflowsHookContext = createContext<WorkflowsHookContextValue | null>(null);

export function useWorkflowsHook() {
  const ctx = useContext(WorkflowsHookContext);
  if (!ctx) {
    throw new Error(`useWorkflowsHook must be used within a WorkflowsHook`);
  }
  return ctx;
}

interface WorkflowsHookProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function WorkflowsHook({
  children,
  initialActive = false,
  initialLabel = 'WorkflowsHook',
}: WorkflowsHookProps) {
  const [state, setState] = useState<WorkflowsHookState>({
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

  const contextValue = useMemo<WorkflowsHookContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <WorkflowsHookContext.Provider value={contextValue}>
      {children}
      <WorkflowsComposer />
    </WorkflowsHookContext.Provider>
  );
}
