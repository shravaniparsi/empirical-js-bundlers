import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import FaqDonut from './FaqDonut';
import FaqToast from './FaqToast';

interface FaqContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface FaqContextContextValue {
  state: FaqContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const FaqContextContext = createContext<FaqContextContextValue | null>(null);

export function useFaqContext() {
  const ctx = useContext(FaqContextContext);
  if (!ctx) {
    throw new Error(`useFaqContext must be used within a FaqContext`);
  }
  return ctx;
}

interface FaqContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function FaqContext({
  children,
  initialActive = false,
  initialLabel = 'FaqContext',
}: FaqContextProps) {
  const [state, setState] = useState<FaqContextState>({
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

  const contextValue = useMemo<FaqContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <FaqContextContext.Provider value={contextValue}>
      {children}
      <FaqDonut />
      <FaqToast />
    </FaqContextContext.Provider>
  );
}
