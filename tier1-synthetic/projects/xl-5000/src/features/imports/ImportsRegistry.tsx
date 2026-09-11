import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ImportsGauge1 from './ImportsGauge1';

interface ImportsRegistryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ImportsRegistryContextValue {
  state: ImportsRegistryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ImportsRegistryContext = createContext<ImportsRegistryContextValue | null>(null);

export function useImportsRegistry() {
  const ctx = useContext(ImportsRegistryContext);
  if (!ctx) {
    throw new Error(`useImportsRegistry must be used within a ImportsRegistry`);
  }
  return ctx;
}

interface ImportsRegistryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ImportsRegistry({
  children,
  initialActive = false,
  initialLabel = 'ImportsRegistry',
}: ImportsRegistryProps) {
  const [state, setState] = useState<ImportsRegistryState>({
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

  const contextValue = useMemo<ImportsRegistryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ImportsRegistryContext.Provider value={contextValue}>
      {children}
      <ImportsGauge1 />
    </ImportsRegistryContext.Provider>
  );
}
