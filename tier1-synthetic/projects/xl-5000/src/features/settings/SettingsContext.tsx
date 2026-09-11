import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ReviewsStat from '../reviews/ReviewsStat';
import ActivityLabel from '../activity/ActivityLabel';

interface SettingsContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SettingsContextContextValue {
  state: SettingsContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SettingsContextContext = createContext<SettingsContextContextValue | null>(null);

export function useSettingsContext() {
  const ctx = useContext(SettingsContextContext);
  if (!ctx) {
    throw new Error(`useSettingsContext must be used within a SettingsContext`);
  }
  return ctx;
}

interface SettingsContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SettingsContext({
  children,
  initialActive = false,
  initialLabel = 'SettingsContext',
}: SettingsContextProps) {
  const [state, setState] = useState<SettingsContextState>({
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

  const contextValue = useMemo<SettingsContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SettingsContextContext.Provider value={contextValue}>
      {children}
      <ReviewsStat />
      <ActivityLabel />
    </SettingsContextContext.Provider>
  );
}
