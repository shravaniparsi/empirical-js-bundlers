import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import TeamsDatePicker1 from './TeamsDatePicker1';

interface TeamsHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TeamsHOCContextValue {
  state: TeamsHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TeamsHOCContext = createContext<TeamsHOCContextValue | null>(null);

export function useTeamsHOC() {
  const ctx = useContext(TeamsHOCContext);
  if (!ctx) {
    throw new Error(`useTeamsHOC must be used within a TeamsHOC`);
  }
  return ctx;
}

interface TeamsHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TeamsHOC({
  children,
  initialActive = false,
  initialLabel = 'TeamsHOC',
}: TeamsHOCProps) {
  const [state, setState] = useState<TeamsHOCState>({
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

  const contextValue = useMemo<TeamsHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TeamsHOCContext.Provider value={contextValue}>
      {children}
      <TeamsDatePicker1 />
    </TeamsHOCContext.Provider>
  );
}
