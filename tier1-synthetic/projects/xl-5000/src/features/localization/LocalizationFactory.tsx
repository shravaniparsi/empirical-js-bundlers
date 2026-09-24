import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import LocalizationSummary1 from './LocalizationSummary1';
import LocalizationModal from './LocalizationModal';

interface LocalizationFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface LocalizationFactoryContextValue {
  state: LocalizationFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const LocalizationFactoryContext = createContext<LocalizationFactoryContextValue | null>(null);

export function useLocalizationFactory() {
  const ctx = useContext(LocalizationFactoryContext);
  if (!ctx) {
    throw new Error(`useLocalizationFactory must be used within a LocalizationFactory`);
  }
  return ctx;
}

interface LocalizationFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function LocalizationFactory({
  children,
  initialActive = false,
  initialLabel = 'LocalizationFactory',
}: LocalizationFactoryProps) {
  const [state, setState] = useState<LocalizationFactoryState>({
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

  const contextValue = useMemo<LocalizationFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <LocalizationFactoryContext.Provider value={contextValue}>
      {children}
      <LocalizationSummary1 />
      <LocalizationModal />
    </LocalizationFactoryContext.Provider>
  );
}
