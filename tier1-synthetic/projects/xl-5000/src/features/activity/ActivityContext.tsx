import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ActivityDetail from './ActivityDetail';
import ThemesColorPicker from '../themes/ThemesColorPicker';
import InventoryProgress2 from '../inventory/InventoryProgress2';

interface ActivityContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ActivityContextContextValue {
  state: ActivityContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ActivityContextContext = createContext<ActivityContextContextValue | null>(null);

export function useActivityContext() {
  const ctx = useContext(ActivityContextContext);
  if (!ctx) {
    throw new Error(`useActivityContext must be used within a ActivityContext`);
  }
  return ctx;
}

interface ActivityContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ActivityContext({
  children,
  initialActive = false,
  initialLabel = 'ActivityContext',
}: ActivityContextProps) {
  const [state, setState] = useState<ActivityContextState>({
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

  const contextValue = useMemo<ActivityContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ActivityContextContext.Provider value={contextValue}>
      {children}
      <ActivityDetail />
      <ThemesColorPicker />
      <InventoryProgress2 />
    </ActivityContextContext.Provider>
  );
}
