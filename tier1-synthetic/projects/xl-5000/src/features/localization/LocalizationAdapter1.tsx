import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import LocalizationWrapper from './LocalizationWrapper';

interface LocalizationAdapter1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface LocalizationAdapter1ContextValue {
  state: LocalizationAdapter1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const LocalizationAdapter1Context = createContext<LocalizationAdapter1ContextValue | null>(null);

export function useLocalizationAdapter1() {
  const ctx = useContext(LocalizationAdapter1Context);
  if (!ctx) {
    throw new Error(`useLocalizationAdapter1 must be used within a LocalizationAdapter1`);
  }
  return ctx;
}

interface LocalizationAdapter1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function LocalizationAdapter1({
  children,
  initialActive = false,
  initialLabel = 'LocalizationAdapter1',
}: LocalizationAdapter1Props) {
  const [state, setState] = useState<LocalizationAdapter1State>({
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

  const contextValue = useMemo<LocalizationAdapter1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <LocalizationAdapter1Context.Provider value={contextValue}>
      {children}
      <LocalizationWrapper />
    </LocalizationAdapter1Context.Provider>
  );
}
