import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import TemplatesRank from './TemplatesRank';
import TemplatesGrid from './TemplatesGrid';

interface TemplatesComposer3State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TemplatesComposer3ContextValue {
  state: TemplatesComposer3State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TemplatesComposer3Context = createContext<TemplatesComposer3ContextValue | null>(null);

export function useTemplatesComposer3() {
  const ctx = useContext(TemplatesComposer3Context);
  if (!ctx) {
    throw new Error(`useTemplatesComposer3 must be used within a TemplatesComposer3`);
  }
  return ctx;
}

interface TemplatesComposer3Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TemplatesComposer3({
  children,
  initialActive = false,
  initialLabel = 'TemplatesComposer3',
}: TemplatesComposer3Props) {
  const [state, setState] = useState<TemplatesComposer3State>({
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

  const contextValue = useMemo<TemplatesComposer3ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TemplatesComposer3Context.Provider value={contextValue}>
      {children}
      <TemplatesRank />
      <TemplatesGrid />
    </TemplatesComposer3Context.Provider>
  );
}
