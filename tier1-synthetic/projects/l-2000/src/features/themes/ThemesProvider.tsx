import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ThemesTimeline from './ThemesTimeline';
import OrdersCollapse1 from '../orders/OrdersCollapse1';

interface ThemesProviderState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ThemesProviderContextValue {
  state: ThemesProviderState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ThemesProviderContext = createContext<ThemesProviderContextValue | null>(null);

export function useThemesProvider() {
  const ctx = useContext(ThemesProviderContext);
  if (!ctx) {
    throw new Error(`useThemesProvider must be used within a ThemesProvider`);
  }
  return ctx;
}

interface ThemesProviderProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ThemesProvider({
  children,
  initialActive = false,
  initialLabel = 'ThemesProvider',
}: ThemesProviderProps) {
  const [state, setState] = useState<ThemesProviderState>({
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

  const contextValue = useMemo<ThemesProviderContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ThemesProviderContext.Provider value={contextValue}>
      {children}
      <ThemesTimeline />
      <OrdersCollapse1 />
    </ThemesProviderContext.Provider>
  );
}
