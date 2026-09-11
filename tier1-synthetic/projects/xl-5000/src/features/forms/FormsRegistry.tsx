import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface FormsRegistryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface FormsRegistryContextValue {
  state: FormsRegistryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const FormsRegistryContext = createContext<FormsRegistryContextValue | null>(null);

export function useFormsRegistry() {
  const ctx = useContext(FormsRegistryContext);
  if (!ctx) {
    throw new Error(`useFormsRegistry must be used within a FormsRegistry`);
  }
  return ctx;
}

interface FormsRegistryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function FormsRegistry({
  children,
  initialActive = false,
  initialLabel = 'FormsRegistry',
}: FormsRegistryProps) {
  const [state, setState] = useState<FormsRegistryState>({
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

  const contextValue = useMemo<FormsRegistryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <FormsRegistryContext.Provider value={contextValue}>
      {children}

    </FormsRegistryContext.Provider>
  );
}
