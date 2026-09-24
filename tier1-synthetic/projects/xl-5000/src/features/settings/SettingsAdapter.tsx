import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SettingsPanel from './SettingsPanel';
import SettingsHeatmap from './SettingsHeatmap';
import SettingsSummary2 from './SettingsSummary2';

interface SettingsAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SettingsAdapterContextValue {
  state: SettingsAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SettingsAdapterContext = createContext<SettingsAdapterContextValue | null>(null);

export function useSettingsAdapter() {
  const ctx = useContext(SettingsAdapterContext);
  if (!ctx) {
    throw new Error(`useSettingsAdapter must be used within a SettingsAdapter`);
  }
  return ctx;
}

interface SettingsAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SettingsAdapter({
  children,
  initialActive = false,
  initialLabel = 'SettingsAdapter',
}: SettingsAdapterProps) {
  const [state, setState] = useState<SettingsAdapterState>({
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

  const contextValue = useMemo<SettingsAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SettingsAdapterContext.Provider value={contextValue}>
      {children}
      <SettingsPanel />
      <SettingsHeatmap />
      <SettingsSummary2 />
    </SettingsAdapterContext.Provider>
  );
}
