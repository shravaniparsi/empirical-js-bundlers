import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ImportsHeader from './ImportsHeader';
import ImportsSuspense from './ImportsSuspense';
import ImportsScroll2 from './ImportsScroll2';

interface ImportsProvider1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ImportsProvider1ContextValue {
  state: ImportsProvider1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ImportsProvider1Context = createContext<ImportsProvider1ContextValue | null>(null);

export function useImportsProvider1() {
  const ctx = useContext(ImportsProvider1Context);
  if (!ctx) {
    throw new Error(`useImportsProvider1 must be used within a ImportsProvider1`);
  }
  return ctx;
}

interface ImportsProvider1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ImportsProvider1({
  children,
  initialActive = false,
  initialLabel = 'ImportsProvider1',
}: ImportsProvider1Props) {
  const [state, setState] = useState<ImportsProvider1State>({
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

  const contextValue = useMemo<ImportsProvider1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ImportsProvider1Context.Provider value={contextValue}>
      {children}
      <ImportsHeader />
      <ImportsSuspense />
      <ImportsScroll2 />
    </ImportsProvider1Context.Provider>
  );
}
