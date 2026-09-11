import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ThemesDivider from './ThemesDivider';
import ThemesHeatmap from './ThemesHeatmap';

interface ThemesBridgeState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ThemesBridgeContextValue {
  state: ThemesBridgeState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ThemesBridgeContext = createContext<ThemesBridgeContextValue | null>(null);

export function useThemesBridge() {
  const ctx = useContext(ThemesBridgeContext);
  if (!ctx) {
    throw new Error(`useThemesBridge must be used within a ThemesBridge`);
  }
  return ctx;
}

interface ThemesBridgeProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ThemesBridge({
  children,
  initialActive = false,
  initialLabel = 'ThemesBridge',
}: ThemesBridgeProps) {
  const [state, setState] = useState<ThemesBridgeState>({
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

  const contextValue = useMemo<ThemesBridgeContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ThemesBridgeContext.Provider value={contextValue}>
      {children}
      <ThemesDivider />
      <ThemesHeatmap />
    </ThemesBridgeContext.Provider>
  );
}
