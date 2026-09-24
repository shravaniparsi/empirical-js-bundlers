import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SettingsCollapse from './SettingsCollapse';

interface SettingsWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SettingsWrapperContextValue {
  state: SettingsWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SettingsWrapperContext = createContext<SettingsWrapperContextValue | null>(null);

export function useSettingsWrapper() {
  const ctx = useContext(SettingsWrapperContext);
  if (!ctx) {
    throw new Error(`useSettingsWrapper must be used within a SettingsWrapper`);
  }
  return ctx;
}

interface SettingsWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SettingsWrapper({
  children,
  initialActive = false,
  initialLabel = 'SettingsWrapper',
}: SettingsWrapperProps) {
  const [state, setState] = useState<SettingsWrapperState>({
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

  const contextValue = useMemo<SettingsWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SettingsWrapperContext.Provider value={contextValue}>
      {children}
      <SettingsCollapse />
    </SettingsWrapperContext.Provider>
  );
}
