import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ThemesList1 from './ThemesList1';
import ThemesPreview from './ThemesPreview';
import ThemesProvider from './ThemesProvider';
import CategoriesBadge1 from '../categories/CategoriesBadge1';
import FormsColorPicker from '../forms/FormsColorPicker';
import InventoryChip3 from '../inventory/InventoryChip3';

interface ThemesWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ThemesWrapperContextValue {
  state: ThemesWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ThemesWrapperContext = createContext<ThemesWrapperContextValue | null>(null);

export function useThemesWrapper() {
  const ctx = useContext(ThemesWrapperContext);
  if (!ctx) {
    throw new Error(`useThemesWrapper must be used within a ThemesWrapper`);
  }
  return ctx;
}

interface ThemesWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ThemesWrapper({
  children,
  initialActive = false,
  initialLabel = 'ThemesWrapper',
}: ThemesWrapperProps) {
  const [state, setState] = useState<ThemesWrapperState>({
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

  const contextValue = useMemo<ThemesWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ThemesWrapperContext.Provider value={contextValue}>
      {children}
      <ThemesList1 />
      <ThemesPreview />
      <ThemesProvider />
      <CategoriesBadge1 />
      <FormsColorPicker />
      <InventoryChip3 />
    </ThemesWrapperContext.Provider>
  );
}
