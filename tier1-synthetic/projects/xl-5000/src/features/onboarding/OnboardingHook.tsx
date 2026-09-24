import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import OnboardingThumbnail1 from './OnboardingThumbnail1';
import OnboardingScroll2 from './OnboardingScroll2';
import InventoryBreadcrumb from '../inventory/InventoryBreadcrumb';

interface OnboardingHookState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface OnboardingHookContextValue {
  state: OnboardingHookState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const OnboardingHookContext = createContext<OnboardingHookContextValue | null>(null);

export function useOnboardingHook() {
  const ctx = useContext(OnboardingHookContext);
  if (!ctx) {
    throw new Error(`useOnboardingHook must be used within a OnboardingHook`);
  }
  return ctx;
}

interface OnboardingHookProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function OnboardingHook({
  children,
  initialActive = false,
  initialLabel = 'OnboardingHook',
}: OnboardingHookProps) {
  const [state, setState] = useState<OnboardingHookState>({
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

  const contextValue = useMemo<OnboardingHookContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <OnboardingHookContext.Provider value={contextValue}>
      {children}
      <OnboardingThumbnail1 />
      <OnboardingScroll2 />
      <InventoryBreadcrumb />
    </OnboardingHookContext.Provider>
  );
}
