import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import LocalizationRangeSlider2 from './LocalizationRangeSlider2';
import CategoriesPieChart1 from '../categories/CategoriesPieChart1';

interface LocalizationWrapper1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface LocalizationWrapper1ContextValue {
  state: LocalizationWrapper1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const LocalizationWrapper1Context = createContext<LocalizationWrapper1ContextValue | null>(null);

export function useLocalizationWrapper1() {
  const ctx = useContext(LocalizationWrapper1Context);
  if (!ctx) {
    throw new Error(`useLocalizationWrapper1 must be used within a LocalizationWrapper1`);
  }
  return ctx;
}

interface LocalizationWrapper1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function LocalizationWrapper1({
  children,
  initialActive = false,
  initialLabel = 'LocalizationWrapper1',
}: LocalizationWrapper1Props) {
  const [state, setState] = useState<LocalizationWrapper1State>({
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

  const contextValue = useMemo<LocalizationWrapper1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <LocalizationWrapper1Context.Provider value={contextValue}>
      {children}
      <LocalizationRangeSlider2 />
      <CategoriesPieChart1 />
    </LocalizationWrapper1Context.Provider>
  );
}
