import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import WorkflowsConfirm2 from './WorkflowsConfirm2';

interface WorkflowsBridge1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface WorkflowsBridge1ContextValue {
  state: WorkflowsBridge1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const WorkflowsBridge1Context = createContext<WorkflowsBridge1ContextValue | null>(null);

export function useWorkflowsBridge1() {
  const ctx = useContext(WorkflowsBridge1Context);
  if (!ctx) {
    throw new Error(`useWorkflowsBridge1 must be used within a WorkflowsBridge1`);
  }
  return ctx;
}

interface WorkflowsBridge1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function WorkflowsBridge1({
  children,
  initialActive = false,
  initialLabel = 'WorkflowsBridge1',
}: WorkflowsBridge1Props) {
  const [state, setState] = useState<WorkflowsBridge1State>({
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

  const contextValue = useMemo<WorkflowsBridge1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <WorkflowsBridge1Context.Provider value={contextValue}>
      {children}
      <WorkflowsConfirm2 />
    </WorkflowsBridge1Context.Provider>
  );
}
