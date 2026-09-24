import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import WorkflowsHeader from './WorkflowsHeader';
import WorkflowsTabs from './WorkflowsTabs';
import UsersTextArea from '../users/UsersTextArea';

interface WorkflowsComposerState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface WorkflowsComposerContextValue {
  state: WorkflowsComposerState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const WorkflowsComposerContext = createContext<WorkflowsComposerContextValue | null>(null);

export function useWorkflowsComposer() {
  const ctx = useContext(WorkflowsComposerContext);
  if (!ctx) {
    throw new Error(`useWorkflowsComposer must be used within a WorkflowsComposer`);
  }
  return ctx;
}

interface WorkflowsComposerProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function WorkflowsComposer({
  children,
  initialActive = false,
  initialLabel = 'WorkflowsComposer',
}: WorkflowsComposerProps) {
  const [state, setState] = useState<WorkflowsComposerState>({
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

  const contextValue = useMemo<WorkflowsComposerContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <WorkflowsComposerContext.Provider value={contextValue}>
      {children}
      <WorkflowsHeader />
      <WorkflowsTabs />
      <UsersTextArea />
    </WorkflowsComposerContext.Provider>
  );
}
