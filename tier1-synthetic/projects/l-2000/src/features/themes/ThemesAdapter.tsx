import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ThemesSpacer from './ThemesSpacer';
import ThemesInput from './ThemesInput';
import ThemesTag from './ThemesTag';

interface ThemesAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ThemesAdapterContextValue {
  state: ThemesAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ThemesAdapterContext = createContext<ThemesAdapterContextValue | null>(null);

export function useThemesAdapter() {
  const ctx = useContext(ThemesAdapterContext);
  if (!ctx) {
    throw new Error(`useThemesAdapter must be used within a ThemesAdapter`);
  }
  return ctx;
}

interface ThemesAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ThemesAdapter({
  children,
  initialActive = false,
  initialLabel = 'ThemesAdapter',
}: ThemesAdapterProps) {
  const [state, setState] = useState<ThemesAdapterState>({
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

  const contextValue = useMemo<ThemesAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ThemesAdapterContext.Provider value={contextValue}>
      {children}
      <ThemesSpacer />
      <ThemesInput />
      <ThemesTag />
    </ThemesAdapterContext.Provider>
  );
}
