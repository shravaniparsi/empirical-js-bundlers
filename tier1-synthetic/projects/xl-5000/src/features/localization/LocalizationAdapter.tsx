import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import LocalizationBottomNav from './LocalizationBottomNav';
import LocalizationColorPicker from './LocalizationColorPicker';
import CheckoutFunnel from '../checkout/CheckoutFunnel';

interface LocalizationAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface LocalizationAdapterContextValue {
  state: LocalizationAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const LocalizationAdapterContext = createContext<LocalizationAdapterContextValue | null>(null);

export function useLocalizationAdapter() {
  const ctx = useContext(LocalizationAdapterContext);
  if (!ctx) {
    throw new Error(`useLocalizationAdapter must be used within a LocalizationAdapter`);
  }
  return ctx;
}

interface LocalizationAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function LocalizationAdapter({
  children,
  initialActive = false,
  initialLabel = 'LocalizationAdapter',
}: LocalizationAdapterProps) {
  const [state, setState] = useState<LocalizationAdapterState>({
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

  const contextValue = useMemo<LocalizationAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <LocalizationAdapterContext.Provider value={contextValue}>
      {children}
      <LocalizationBottomNav />
      <LocalizationColorPicker />
      <CheckoutFunnel />
    </LocalizationAdapterContext.Provider>
  );
}
