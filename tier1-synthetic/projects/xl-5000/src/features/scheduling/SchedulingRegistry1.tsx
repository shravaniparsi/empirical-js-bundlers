import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SchedulingCard from './SchedulingCard';
import SchedulingMeter1 from './SchedulingMeter1';

interface SchedulingRegistry1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SchedulingRegistry1ContextValue {
  state: SchedulingRegistry1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SchedulingRegistry1Context = createContext<SchedulingRegistry1ContextValue | null>(null);

export function useSchedulingRegistry1() {
  const ctx = useContext(SchedulingRegistry1Context);
  if (!ctx) {
    throw new Error(`useSchedulingRegistry1 must be used within a SchedulingRegistry1`);
  }
  return ctx;
}

interface SchedulingRegistry1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SchedulingRegistry1({
  children,
  initialActive = false,
  initialLabel = 'SchedulingRegistry1',
}: SchedulingRegistry1Props) {
  const [state, setState] = useState<SchedulingRegistry1State>({
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

  const contextValue = useMemo<SchedulingRegistry1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SchedulingRegistry1Context.Provider value={contextValue}>
      {children}
      <SchedulingCard />
      <SchedulingMeter1 />
    </SchedulingRegistry1Context.Provider>
  );
}
