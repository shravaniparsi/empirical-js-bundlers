import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import WorkflowsBanner from './WorkflowsBanner';
import WorkflowsPrefetch from './WorkflowsPrefetch';
import IntegrationsScroll1 from '../integrations/IntegrationsScroll1';
import NotificationsHeatmap1 from '../notifications/NotificationsHeatmap1';

interface WorkflowsHook1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface WorkflowsHook1ContextValue {
  state: WorkflowsHook1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const WorkflowsHook1Context = createContext<WorkflowsHook1ContextValue | null>(null);

export function useWorkflowsHook1() {
  const ctx = useContext(WorkflowsHook1Context);
  if (!ctx) {
    throw new Error(`useWorkflowsHook1 must be used within a WorkflowsHook1`);
  }
  return ctx;
}

interface WorkflowsHook1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function WorkflowsHook1({
  children,
  initialActive = false,
  initialLabel = 'WorkflowsHook1',
}: WorkflowsHook1Props) {
  const [state, setState] = useState<WorkflowsHook1State>({
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

  const contextValue = useMemo<WorkflowsHook1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <WorkflowsHook1Context.Provider value={contextValue}>
      {children}
      <WorkflowsBanner />
      <WorkflowsPrefetch />
      <IntegrationsScroll1 />
      <NotificationsHeatmap1 />
    </WorkflowsHook1Context.Provider>
  );
}
