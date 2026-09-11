import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface TeamsHOC2State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TeamsHOC2ContextValue {
  state: TeamsHOC2State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TeamsHOC2Context = createContext<TeamsHOC2ContextValue | null>(null);

export function useTeamsHOC2() {
  const ctx = useContext(TeamsHOC2Context);
  if (!ctx) {
    throw new Error(`useTeamsHOC2 must be used within a TeamsHOC2`);
  }
  return ctx;
}

interface TeamsHOC2Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TeamsHOC2({
  children,
  initialActive = false,
  initialLabel = 'TeamsHOC2',
}: TeamsHOC2Props) {
  const [state, setState] = useState<TeamsHOC2State>({
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

  const contextValue = useMemo<TeamsHOC2ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TeamsHOC2Context.Provider value={contextValue}>
      {children}

    </TeamsHOC2Context.Provider>
  );
}
