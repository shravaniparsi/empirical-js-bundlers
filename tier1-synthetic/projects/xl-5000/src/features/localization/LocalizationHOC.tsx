import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import LocalizationSpacer from './LocalizationSpacer';
import SchedulingToast from '../scheduling/SchedulingToast';

interface LocalizationHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface LocalizationHOCContextValue {
  state: LocalizationHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const LocalizationHOCContext = createContext<LocalizationHOCContextValue | null>(null);

export function useLocalizationHOC() {
  const ctx = useContext(LocalizationHOCContext);
  if (!ctx) {
    throw new Error(`useLocalizationHOC must be used within a LocalizationHOC`);
  }
  return ctx;
}

interface LocalizationHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function LocalizationHOC({
  children,
  initialActive = false,
  initialLabel = 'LocalizationHOC',
}: LocalizationHOCProps) {
  const [state, setState] = useState<LocalizationHOCState>({
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

  const contextValue = useMemo<LocalizationHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <LocalizationHOCContext.Provider value={contextValue}>
      {children}
      <LocalizationSpacer />
      <SchedulingToast />
    </LocalizationHOCContext.Provider>
  );
}
