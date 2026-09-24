import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SurveysSummary from './SurveysSummary';

interface SurveysAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SurveysAdapterContextValue {
  state: SurveysAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SurveysAdapterContext = createContext<SurveysAdapterContextValue | null>(null);

export function useSurveysAdapter() {
  const ctx = useContext(SurveysAdapterContext);
  if (!ctx) {
    throw new Error(`useSurveysAdapter must be used within a SurveysAdapter`);
  }
  return ctx;
}

interface SurveysAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SurveysAdapter({
  children,
  initialActive = false,
  initialLabel = 'SurveysAdapter',
}: SurveysAdapterProps) {
  const [state, setState] = useState<SurveysAdapterState>({
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

  const contextValue = useMemo<SurveysAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SurveysAdapterContext.Provider value={contextValue}>
      {children}
      <SurveysSummary />
    </SurveysAdapterContext.Provider>
  );
}
