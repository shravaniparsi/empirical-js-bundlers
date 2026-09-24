import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import TemplatesStack1 from './TemplatesStack1';

interface TemplatesComposerState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TemplatesComposerContextValue {
  state: TemplatesComposerState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TemplatesComposerContext = createContext<TemplatesComposerContextValue | null>(null);

export function useTemplatesComposer() {
  const ctx = useContext(TemplatesComposerContext);
  if (!ctx) {
    throw new Error(`useTemplatesComposer must be used within a TemplatesComposer`);
  }
  return ctx;
}

interface TemplatesComposerProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TemplatesComposer({
  children,
  initialActive = false,
  initialLabel = 'TemplatesComposer',
}: TemplatesComposerProps) {
  const [state, setState] = useState<TemplatesComposerState>({
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

  const contextValue = useMemo<TemplatesComposerContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TemplatesComposerContext.Provider value={contextValue}>
      {children}
      <TemplatesStack1 />
    </TemplatesComposerContext.Provider>
  );
}
