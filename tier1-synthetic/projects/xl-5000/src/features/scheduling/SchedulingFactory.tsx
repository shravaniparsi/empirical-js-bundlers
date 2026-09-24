import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SchedulingRating from './SchedulingRating';
import OnboardingPagination1 from '../onboarding/OnboardingPagination1';

interface SchedulingFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SchedulingFactoryContextValue {
  state: SchedulingFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SchedulingFactoryContext = createContext<SchedulingFactoryContextValue | null>(null);

export function useSchedulingFactory() {
  const ctx = useContext(SchedulingFactoryContext);
  if (!ctx) {
    throw new Error(`useSchedulingFactory must be used within a SchedulingFactory`);
  }
  return ctx;
}

interface SchedulingFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SchedulingFactory({
  children,
  initialActive = false,
  initialLabel = 'SchedulingFactory',
}: SchedulingFactoryProps) {
  const [state, setState] = useState<SchedulingFactoryState>({
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

  const contextValue = useMemo<SchedulingFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SchedulingFactoryContext.Provider value={contextValue}>
      {children}
      <SchedulingRating />
      <OnboardingPagination1 />
    </SchedulingFactoryContext.Provider>
  );
}
