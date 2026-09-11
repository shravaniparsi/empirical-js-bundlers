import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import FormsHeatmap from './FormsHeatmap';

interface FormsWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface FormsWrapperContextValue {
  state: FormsWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const FormsWrapperContext = createContext<FormsWrapperContextValue | null>(null);

export function useFormsWrapper() {
  const ctx = useContext(FormsWrapperContext);
  if (!ctx) {
    throw new Error(`useFormsWrapper must be used within a FormsWrapper`);
  }
  return ctx;
}

interface FormsWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function FormsWrapper({
  children,
  initialActive = false,
  initialLabel = 'FormsWrapper',
}: FormsWrapperProps) {
  const [state, setState] = useState<FormsWrapperState>({
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

  const contextValue = useMemo<FormsWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <FormsWrapperContext.Provider value={contextValue}>
      {children}
      <FormsHeatmap />
    </FormsWrapperContext.Provider>
  );
}
