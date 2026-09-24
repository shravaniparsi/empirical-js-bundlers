import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ImportsContainer from './ImportsContainer';
import ImportsRegistry from './ImportsRegistry';
import ImportsHeader from './ImportsHeader';

interface ImportsAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ImportsAdapterContextValue {
  state: ImportsAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ImportsAdapterContext = createContext<ImportsAdapterContextValue | null>(null);

export function useImportsAdapter() {
  const ctx = useContext(ImportsAdapterContext);
  if (!ctx) {
    throw new Error(`useImportsAdapter must be used within a ImportsAdapter`);
  }
  return ctx;
}

interface ImportsAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ImportsAdapter({
  children,
  initialActive = false,
  initialLabel = 'ImportsAdapter',
}: ImportsAdapterProps) {
  const [state, setState] = useState<ImportsAdapterState>({
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

  const contextValue = useMemo<ImportsAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ImportsAdapterContext.Provider value={contextValue}>
      {children}
      <ImportsContainer />
      <ImportsRegistry />
      <ImportsHeader />
    </ImportsAdapterContext.Provider>
  );
}
