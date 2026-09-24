import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface TemplatesComposer1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TemplatesComposer1ContextValue {
  state: TemplatesComposer1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TemplatesComposer1Context = createContext<TemplatesComposer1ContextValue | null>(null);

export function useTemplatesComposer1() {
  const ctx = useContext(TemplatesComposer1Context);
  if (!ctx) {
    throw new Error(`useTemplatesComposer1 must be used within a TemplatesComposer1`);
  }
  return ctx;
}

interface TemplatesComposer1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TemplatesComposer1({
  children,
  initialActive = false,
  initialLabel = 'TemplatesComposer1',
}: TemplatesComposer1Props) {
  const [state, setState] = useState<TemplatesComposer1State>({
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

  const contextValue = useMemo<TemplatesComposer1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TemplatesComposer1Context.Provider value={contextValue}>
      {children}

    </TemplatesComposer1Context.Provider>
  );
}
