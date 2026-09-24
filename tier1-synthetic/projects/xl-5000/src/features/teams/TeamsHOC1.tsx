import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import TeamsToast1 from './TeamsToast1';
import TeamsAvatar3 from './TeamsAvatar3';

interface TeamsHOC1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TeamsHOC1ContextValue {
  state: TeamsHOC1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TeamsHOC1Context = createContext<TeamsHOC1ContextValue | null>(null);

export function useTeamsHOC1() {
  const ctx = useContext(TeamsHOC1Context);
  if (!ctx) {
    throw new Error(`useTeamsHOC1 must be used within a TeamsHOC1`);
  }
  return ctx;
}

interface TeamsHOC1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TeamsHOC1({
  children,
  initialActive = false,
  initialLabel = 'TeamsHOC1',
}: TeamsHOC1Props) {
  const [state, setState] = useState<TeamsHOC1State>({
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

  const contextValue = useMemo<TeamsHOC1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TeamsHOC1Context.Provider value={contextValue}>
      {children}
      <TeamsToast1 />
      <TeamsAvatar3 />
    </TeamsHOC1Context.Provider>
  );
}
