import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SettingsCard from './SettingsCard';
import SettingsLoader from './SettingsLoader';

interface SettingsHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SettingsHOCContextValue {
  state: SettingsHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SettingsHOCContext = createContext<SettingsHOCContextValue | null>(null);

export function useSettingsHOC() {
  const ctx = useContext(SettingsHOCContext);
  if (!ctx) {
    throw new Error(`useSettingsHOC must be used within a SettingsHOC`);
  }
  return ctx;
}

interface SettingsHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SettingsHOC({
  children,
  initialActive = false,
  initialLabel = 'SettingsHOC',
}: SettingsHOCProps) {
  const [state, setState] = useState<SettingsHOCState>({
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

  const contextValue = useMemo<SettingsHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SettingsHOCContext.Provider value={contextValue}>
      {children}
      <SettingsCard />
      <SettingsLoader />
    </SettingsHOCContext.Provider>
  );
}
