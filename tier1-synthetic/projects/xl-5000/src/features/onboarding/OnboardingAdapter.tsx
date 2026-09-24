import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ReviewsSpacer1 from '../reviews/ReviewsSpacer1';

interface OnboardingAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface OnboardingAdapterContextValue {
  state: OnboardingAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const OnboardingAdapterContext = createContext<OnboardingAdapterContextValue | null>(null);

export function useOnboardingAdapter() {
  const ctx = useContext(OnboardingAdapterContext);
  if (!ctx) {
    throw new Error(`useOnboardingAdapter must be used within a OnboardingAdapter`);
  }
  return ctx;
}

interface OnboardingAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function OnboardingAdapter({
  children,
  initialActive = false,
  initialLabel = 'OnboardingAdapter',
}: OnboardingAdapterProps) {
  const [state, setState] = useState<OnboardingAdapterState>({
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

  const contextValue = useMemo<OnboardingAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <OnboardingAdapterContext.Provider value={contextValue}>
      {children}
      <ReviewsSpacer1 />
    </OnboardingAdapterContext.Provider>
  );
}
