import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SettingsFileUpload from './SettingsFileUpload';

interface SettingsHookState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SettingsHookContextValue {
  state: SettingsHookState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SettingsHookContext = createContext<SettingsHookContextValue | null>(null);

export function useSettingsHook() {
  const ctx = useContext(SettingsHookContext);
  if (!ctx) {
    throw new Error(`useSettingsHook must be used within a SettingsHook`);
  }
  return ctx;
}

interface SettingsHookProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SettingsHook({
  children,
  initialActive = false,
  initialLabel = 'SettingsHook',
}: SettingsHookProps) {
  const [state, setState] = useState<SettingsHookState>({
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

  const contextValue = useMemo<SettingsHookContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SettingsHookContext.Provider value={contextValue}>
      {children}
      <SettingsFileUpload />
    </SettingsHookContext.Provider>
  );
}
