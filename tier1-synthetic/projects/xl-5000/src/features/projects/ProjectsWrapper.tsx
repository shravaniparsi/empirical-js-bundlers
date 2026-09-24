import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ProjectsSummary from './ProjectsSummary';
import ProjectsFunnel from './ProjectsFunnel';
import ProjectsAlert from './ProjectsAlert';
import FormsColorPicker from '../forms/FormsColorPicker';

interface ProjectsWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ProjectsWrapperContextValue {
  state: ProjectsWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ProjectsWrapperContext = createContext<ProjectsWrapperContextValue | null>(null);

export function useProjectsWrapper() {
  const ctx = useContext(ProjectsWrapperContext);
  if (!ctx) {
    throw new Error(`useProjectsWrapper must be used within a ProjectsWrapper`);
  }
  return ctx;
}

interface ProjectsWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ProjectsWrapper({
  children,
  initialActive = false,
  initialLabel = 'ProjectsWrapper',
}: ProjectsWrapperProps) {
  const [state, setState] = useState<ProjectsWrapperState>({
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

  const contextValue = useMemo<ProjectsWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ProjectsWrapperContext.Provider value={contextValue}>
      {children}
      <ProjectsSummary />
      <ProjectsFunnel />
      <ProjectsAlert />
      <FormsColorPicker />
    </ProjectsWrapperContext.Provider>
  );
}
