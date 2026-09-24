import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import LocalizationAvatar1 from './LocalizationAvatar1';

interface LocalizationHOC1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface LocalizationHOC1ContextValue {
  state: LocalizationHOC1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const LocalizationHOC1Context = createContext<LocalizationHOC1ContextValue | null>(null);

export function useLocalizationHOC1() {
  const ctx = useContext(LocalizationHOC1Context);
  if (!ctx) {
    throw new Error(`useLocalizationHOC1 must be used within a LocalizationHOC1`);
  }
  return ctx;
}

interface LocalizationHOC1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function LocalizationHOC1({
  children,
  initialActive = false,
  initialLabel = 'LocalizationHOC1',
}: LocalizationHOC1Props) {
  const [state, setState] = useState<LocalizationHOC1State>({
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

  const contextValue = useMemo<LocalizationHOC1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <LocalizationHOC1Context.Provider value={contextValue}>
      {children}
      <LocalizationAvatar1 />
    </LocalizationHOC1Context.Provider>
  );
}
