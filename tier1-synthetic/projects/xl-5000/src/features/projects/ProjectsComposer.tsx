import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ProjectsList1 from './ProjectsList1';
import ProjectsGrid1 from './ProjectsGrid1';

interface ProjectsComposerState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ProjectsComposerContextValue {
  state: ProjectsComposerState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ProjectsComposerContext = createContext<ProjectsComposerContextValue | null>(null);

export function useProjectsComposer() {
  const ctx = useContext(ProjectsComposerContext);
  if (!ctx) {
    throw new Error(`useProjectsComposer must be used within a ProjectsComposer`);
  }
  return ctx;
}

interface ProjectsComposerProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ProjectsComposer({
  children,
  initialActive = false,
  initialLabel = 'ProjectsComposer',
}: ProjectsComposerProps) {
  const [state, setState] = useState<ProjectsComposerState>({
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

  const contextValue = useMemo<ProjectsComposerContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ProjectsComposerContext.Provider value={contextValue}>
      {children}
      <ProjectsList1 />
      <ProjectsGrid1 />
    </ProjectsComposerContext.Provider>
  );
}
