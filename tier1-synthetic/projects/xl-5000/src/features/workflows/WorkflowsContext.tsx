import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import WorkflowsTable from './WorkflowsTable';
import WorkflowsCached3 from './WorkflowsCached3';
import WorkflowsModal from './WorkflowsModal';

interface WorkflowsContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface WorkflowsContextContextValue {
  state: WorkflowsContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const WorkflowsContextContext = createContext<WorkflowsContextContextValue | null>(null);

export function useWorkflowsContext() {
  const ctx = useContext(WorkflowsContextContext);
  if (!ctx) {
    throw new Error(`useWorkflowsContext must be used within a WorkflowsContext`);
  }
  return ctx;
}

interface WorkflowsContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function WorkflowsContext({
  children,
  initialActive = false,
  initialLabel = 'WorkflowsContext',
}: WorkflowsContextProps) {
  const [state, setState] = useState<WorkflowsContextState>({
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

  const contextValue = useMemo<WorkflowsContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <WorkflowsContextContext.Provider value={contextValue}>
      {children}
      <WorkflowsTable />
      <WorkflowsCached3 />
      <WorkflowsModal />
    </WorkflowsContextContext.Provider>
  );
}
