import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface SchedulingRegistryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SchedulingRegistryContextValue {
  state: SchedulingRegistryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SchedulingRegistryContext = createContext<SchedulingRegistryContextValue | null>(null);

export function useSchedulingRegistry() {
  const ctx = useContext(SchedulingRegistryContext);
  if (!ctx) {
    throw new Error(`useSchedulingRegistry must be used within a SchedulingRegistry`);
  }
  return ctx;
}

interface SchedulingRegistryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SchedulingRegistry({
  children,
  initialActive = false,
  initialLabel = 'SchedulingRegistry',
}: SchedulingRegistryProps) {
  const [state, setState] = useState<SchedulingRegistryState>({
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

  const contextValue = useMemo<SchedulingRegistryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SchedulingRegistryContext.Provider value={contextValue}>
      {children}

    </SchedulingRegistryContext.Provider>
  );
}
