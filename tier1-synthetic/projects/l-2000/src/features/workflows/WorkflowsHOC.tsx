import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import WorkflowsTable2 from './WorkflowsTable2';
import WorkflowsHeatmap from './WorkflowsHeatmap';

interface WorkflowsHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface WorkflowsHOCContextValue {
  state: WorkflowsHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const WorkflowsHOCContext = createContext<WorkflowsHOCContextValue | null>(null);

export function useWorkflowsHOC() {
  const ctx = useContext(WorkflowsHOCContext);
  if (!ctx) {
    throw new Error(`useWorkflowsHOC must be used within a WorkflowsHOC`);
  }
  return ctx;
}

interface WorkflowsHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function WorkflowsHOC({
  children,
  initialActive = false,
  initialLabel = 'WorkflowsHOC',
}: WorkflowsHOCProps) {
  const [state, setState] = useState<WorkflowsHOCState>({
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

  const contextValue = useMemo<WorkflowsHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <WorkflowsHOCContext.Provider value={contextValue}>
      {children}
      <WorkflowsTable2 />
      <WorkflowsHeatmap />
    </WorkflowsHOCContext.Provider>
  );
}
