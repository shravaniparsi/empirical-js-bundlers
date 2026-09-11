import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface SchedulingComposerState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SchedulingComposerContextValue {
  state: SchedulingComposerState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SchedulingComposerContext = createContext<SchedulingComposerContextValue | null>(null);

export function useSchedulingComposer() {
  const ctx = useContext(SchedulingComposerContext);
  if (!ctx) {
    throw new Error(`useSchedulingComposer must be used within a SchedulingComposer`);
  }
  return ctx;
}

interface SchedulingComposerProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SchedulingComposer({
  children,
  initialActive = false,
  initialLabel = 'SchedulingComposer',
}: SchedulingComposerProps) {
  const [state, setState] = useState<SchedulingComposerState>({
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

  const contextValue = useMemo<SchedulingComposerContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SchedulingComposerContext.Provider value={contextValue}>
      {children}

    </SchedulingComposerContext.Provider>
  );
}
