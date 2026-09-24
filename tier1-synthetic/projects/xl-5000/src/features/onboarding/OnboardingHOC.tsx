import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface OnboardingHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface OnboardingHOCContextValue {
  state: OnboardingHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const OnboardingHOCContext = createContext<OnboardingHOCContextValue | null>(null);

export function useOnboardingHOC() {
  const ctx = useContext(OnboardingHOCContext);
  if (!ctx) {
    throw new Error(`useOnboardingHOC must be used within a OnboardingHOC`);
  }
  return ctx;
}

interface OnboardingHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function OnboardingHOC({
  children,
  initialActive = false,
  initialLabel = 'OnboardingHOC',
}: OnboardingHOCProps) {
  const [state, setState] = useState<OnboardingHOCState>({
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

  const contextValue = useMemo<OnboardingHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <OnboardingHOCContext.Provider value={contextValue}>
      {children}

    </OnboardingHOCContext.Provider>
  );
}
