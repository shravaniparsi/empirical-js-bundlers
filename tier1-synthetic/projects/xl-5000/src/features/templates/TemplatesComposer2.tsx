import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import TemplatesLabel from './TemplatesLabel';
import TemplatesPanel from './TemplatesPanel';

interface TemplatesComposer2State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TemplatesComposer2ContextValue {
  state: TemplatesComposer2State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TemplatesComposer2Context = createContext<TemplatesComposer2ContextValue | null>(null);

export function useTemplatesComposer2() {
  const ctx = useContext(TemplatesComposer2Context);
  if (!ctx) {
    throw new Error(`useTemplatesComposer2 must be used within a TemplatesComposer2`);
  }
  return ctx;
}

interface TemplatesComposer2Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TemplatesComposer2({
  children,
  initialActive = false,
  initialLabel = 'TemplatesComposer2',
}: TemplatesComposer2Props) {
  const [state, setState] = useState<TemplatesComposer2State>({
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

  const contextValue = useMemo<TemplatesComposer2ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TemplatesComposer2Context.Provider value={contextValue}>
      {children}
      <TemplatesLabel />
      <TemplatesPanel />
    </TemplatesComposer2Context.Provider>
  );
}
