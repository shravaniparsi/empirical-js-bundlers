import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import FormsBadge1 from './FormsBadge1';
import NotificationsHeatmap1 from '../notifications/NotificationsHeatmap1';

interface FormsComposerState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface FormsComposerContextValue {
  state: FormsComposerState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const FormsComposerContext = createContext<FormsComposerContextValue | null>(null);

export function useFormsComposer() {
  const ctx = useContext(FormsComposerContext);
  if (!ctx) {
    throw new Error(`useFormsComposer must be used within a FormsComposer`);
  }
  return ctx;
}

interface FormsComposerProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function FormsComposer({
  children,
  initialActive = false,
  initialLabel = 'FormsComposer',
}: FormsComposerProps) {
  const [state, setState] = useState<FormsComposerState>({
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

  const contextValue = useMemo<FormsComposerContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <FormsComposerContext.Provider value={contextValue}>
      {children}
      <FormsBadge1 />
      <NotificationsHeatmap1 />
    </FormsComposerContext.Provider>
  );
}
