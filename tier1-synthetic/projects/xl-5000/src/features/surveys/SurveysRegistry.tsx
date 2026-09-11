import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SurveysDonut3 from './SurveysDonut3';
import SurveysSummary1 from './SurveysSummary1';
import SurveysInput from './SurveysInput';

interface SurveysRegistryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SurveysRegistryContextValue {
  state: SurveysRegistryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SurveysRegistryContext = createContext<SurveysRegistryContextValue | null>(null);

export function useSurveysRegistry() {
  const ctx = useContext(SurveysRegistryContext);
  if (!ctx) {
    throw new Error(`useSurveysRegistry must be used within a SurveysRegistry`);
  }
  return ctx;
}

interface SurveysRegistryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SurveysRegistry({
  children,
  initialActive = false,
  initialLabel = 'SurveysRegistry',
}: SurveysRegistryProps) {
  const [state, setState] = useState<SurveysRegistryState>({
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

  const contextValue = useMemo<SurveysRegistryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SurveysRegistryContext.Provider value={contextValue}>
      {children}
      <SurveysDonut3 />
      <SurveysSummary1 />
      <SurveysInput />
    </SurveysRegistryContext.Provider>
  );
}
