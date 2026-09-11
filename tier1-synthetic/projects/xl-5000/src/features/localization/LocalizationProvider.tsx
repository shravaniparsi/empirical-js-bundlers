import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import LocalizationHOC1 from './LocalizationHOC1';

interface LocalizationProviderState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface LocalizationProviderContextValue {
  state: LocalizationProviderState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const LocalizationProviderContext = createContext<LocalizationProviderContextValue | null>(null);

export function useLocalizationProvider() {
  const ctx = useContext(LocalizationProviderContext);
  if (!ctx) {
    throw new Error(`useLocalizationProvider must be used within a LocalizationProvider`);
  }
  return ctx;
}

interface LocalizationProviderProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function LocalizationProvider({
  children,
  initialActive = false,
  initialLabel = 'LocalizationProvider',
}: LocalizationProviderProps) {
  const [state, setState] = useState<LocalizationProviderState>({
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

  const contextValue = useMemo<LocalizationProviderContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <LocalizationProviderContext.Provider value={contextValue}>
      {children}
      <LocalizationHOC1 />
    </LocalizationProviderContext.Provider>
  );
}
