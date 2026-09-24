import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import LocalizationSnackbar2 from './LocalizationSnackbar2';
import LocalizationList from './LocalizationList';

interface LocalizationBridgeState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface LocalizationBridgeContextValue {
  state: LocalizationBridgeState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const LocalizationBridgeContext = createContext<LocalizationBridgeContextValue | null>(null);

export function useLocalizationBridge() {
  const ctx = useContext(LocalizationBridgeContext);
  if (!ctx) {
    throw new Error(`useLocalizationBridge must be used within a LocalizationBridge`);
  }
  return ctx;
}

interface LocalizationBridgeProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function LocalizationBridge({
  children,
  initialActive = false,
  initialLabel = 'LocalizationBridge',
}: LocalizationBridgeProps) {
  const [state, setState] = useState<LocalizationBridgeState>({
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

  const contextValue = useMemo<LocalizationBridgeContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <LocalizationBridgeContext.Provider value={contextValue}>
      {children}
      <LocalizationSnackbar2 />
      <LocalizationList />
    </LocalizationBridgeContext.Provider>
  );
}
