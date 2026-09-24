import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import WorkflowsSidebar from './WorkflowsSidebar';

interface WorkflowsAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface WorkflowsAdapterContextValue {
  state: WorkflowsAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const WorkflowsAdapterContext = createContext<WorkflowsAdapterContextValue | null>(null);

export function useWorkflowsAdapter() {
  const ctx = useContext(WorkflowsAdapterContext);
  if (!ctx) {
    throw new Error(`useWorkflowsAdapter must be used within a WorkflowsAdapter`);
  }
  return ctx;
}

interface WorkflowsAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function WorkflowsAdapter({
  children,
  initialActive = false,
  initialLabel = 'WorkflowsAdapter',
}: WorkflowsAdapterProps) {
  const [state, setState] = useState<WorkflowsAdapterState>({
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

  const contextValue = useMemo<WorkflowsAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <WorkflowsAdapterContext.Provider value={contextValue}>
      {children}
      <WorkflowsSidebar />
    </WorkflowsAdapterContext.Provider>
  );
}
