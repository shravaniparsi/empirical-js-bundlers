import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import LocalizationBridge from './LocalizationBridge';

interface LocalizationWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface LocalizationWrapperContextValue {
  state: LocalizationWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const LocalizationWrapperContext = createContext<LocalizationWrapperContextValue | null>(null);

export function useLocalizationWrapper() {
  const ctx = useContext(LocalizationWrapperContext);
  if (!ctx) {
    throw new Error(`useLocalizationWrapper must be used within a LocalizationWrapper`);
  }
  return ctx;
}

interface LocalizationWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function LocalizationWrapper({
  children,
  initialActive = false,
  initialLabel = 'LocalizationWrapper',
}: LocalizationWrapperProps) {
  const [state, setState] = useState<LocalizationWrapperState>({
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

  const contextValue = useMemo<LocalizationWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <LocalizationWrapperContext.Provider value={contextValue}>
      {children}
      <LocalizationBridge />
    </LocalizationWrapperContext.Provider>
  );
}
