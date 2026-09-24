import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface WorkflowsFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface WorkflowsFactoryContextValue {
  state: WorkflowsFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const WorkflowsFactoryContext = createContext<WorkflowsFactoryContextValue | null>(null);

export function useWorkflowsFactory() {
  const ctx = useContext(WorkflowsFactoryContext);
  if (!ctx) {
    throw new Error(`useWorkflowsFactory must be used within a WorkflowsFactory`);
  }
  return ctx;
}

interface WorkflowsFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function WorkflowsFactory({
  children,
  initialActive = false,
  initialLabel = 'WorkflowsFactory',
}: WorkflowsFactoryProps) {
  const [state, setState] = useState<WorkflowsFactoryState>({
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

  const contextValue = useMemo<WorkflowsFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <WorkflowsFactoryContext.Provider value={contextValue}>
      {children}

    </WorkflowsFactoryContext.Provider>
  );
}
