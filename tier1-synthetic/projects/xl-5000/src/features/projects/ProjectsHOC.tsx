import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ProjectsGrid2 from './ProjectsGrid2';
import ProjectsAreaChart3 from './ProjectsAreaChart3';

interface ProjectsHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ProjectsHOCContextValue {
  state: ProjectsHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ProjectsHOCContext = createContext<ProjectsHOCContextValue | null>(null);

export function useProjectsHOC() {
  const ctx = useContext(ProjectsHOCContext);
  if (!ctx) {
    throw new Error(`useProjectsHOC must be used within a ProjectsHOC`);
  }
  return ctx;
}

interface ProjectsHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ProjectsHOC({
  children,
  initialActive = false,
  initialLabel = 'ProjectsHOC',
}: ProjectsHOCProps) {
  const [state, setState] = useState<ProjectsHOCState>({
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

  const contextValue = useMemo<ProjectsHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ProjectsHOCContext.Provider value={contextValue}>
      {children}
      <ProjectsGrid2 />
      <ProjectsAreaChart3 />
    </ProjectsHOCContext.Provider>
  );
}
