import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface ThemesBridge1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ThemesBridge1ContextValue {
  state: ThemesBridge1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ThemesBridge1Context = createContext<ThemesBridge1ContextValue | null>(null);

export function useThemesBridge1() {
  const ctx = useContext(ThemesBridge1Context);
  if (!ctx) {
    throw new Error(`useThemesBridge1 must be used within a ThemesBridge1`);
  }
  return ctx;
}

interface ThemesBridge1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ThemesBridge1({
  children,
  initialActive = false,
  initialLabel = 'ThemesBridge1',
}: ThemesBridge1Props) {
  const [state, setState] = useState<ThemesBridge1State>({
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

  const contextValue = useMemo<ThemesBridge1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ThemesBridge1Context.Provider value={contextValue}>
      {children}

    </ThemesBridge1Context.Provider>
  );
}
