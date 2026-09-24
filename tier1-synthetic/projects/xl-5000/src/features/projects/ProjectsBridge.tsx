import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ProjectsAlert from './ProjectsAlert';
import ProjectsAccordion1 from './ProjectsAccordion1';
import ProjectsAreaChart3 from './ProjectsAreaChart3';

interface ProjectsBridgeState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ProjectsBridgeContextValue {
  state: ProjectsBridgeState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ProjectsBridgeContext = createContext<ProjectsBridgeContextValue | null>(null);

export function useProjectsBridge() {
  const ctx = useContext(ProjectsBridgeContext);
  if (!ctx) {
    throw new Error(`useProjectsBridge must be used within a ProjectsBridge`);
  }
  return ctx;
}

interface ProjectsBridgeProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ProjectsBridge({
  children,
  initialActive = false,
  initialLabel = 'ProjectsBridge',
}: ProjectsBridgeProps) {
  const [state, setState] = useState<ProjectsBridgeState>({
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

  const contextValue = useMemo<ProjectsBridgeContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ProjectsBridgeContext.Provider value={contextValue}>
      {children}
      <ProjectsAlert />
      <ProjectsAccordion1 />
      <ProjectsAreaChart3 />
    </ProjectsBridgeContext.Provider>
  );
}
