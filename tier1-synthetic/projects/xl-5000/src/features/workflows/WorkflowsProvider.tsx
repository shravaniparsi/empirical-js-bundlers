import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import WorkflowsHeatmap1 from './WorkflowsHeatmap1';

interface WorkflowsProviderState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface WorkflowsProviderContextValue {
  state: WorkflowsProviderState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const WorkflowsProviderContext = createContext<WorkflowsProviderContextValue | null>(null);

export function useWorkflowsProvider() {
  const ctx = useContext(WorkflowsProviderContext);
  if (!ctx) {
    throw new Error(`useWorkflowsProvider must be used within a WorkflowsProvider`);
  }
  return ctx;
}

interface WorkflowsProviderProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function WorkflowsProvider({
  children,
  initialActive = false,
  initialLabel = 'WorkflowsProvider',
}: WorkflowsProviderProps) {
  const [state, setState] = useState<WorkflowsProviderState>({
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

  const contextValue = useMemo<WorkflowsProviderContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <WorkflowsProviderContext.Provider value={contextValue}>
      {children}
      <WorkflowsHeatmap1 />
    </WorkflowsProviderContext.Provider>
  );
}
