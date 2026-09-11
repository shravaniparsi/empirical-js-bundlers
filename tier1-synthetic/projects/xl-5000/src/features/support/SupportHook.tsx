import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SupportAvatar from './SupportAvatar';
import SupportRangeSlider from './SupportRangeSlider';
import InventoryBanner1 from '../inventory/InventoryBanner1';

interface SupportHookState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SupportHookContextValue {
  state: SupportHookState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SupportHookContext = createContext<SupportHookContextValue | null>(null);

export function useSupportHook() {
  const ctx = useContext(SupportHookContext);
  if (!ctx) {
    throw new Error(`useSupportHook must be used within a SupportHook`);
  }
  return ctx;
}

interface SupportHookProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SupportHook({
  children,
  initialActive = false,
  initialLabel = 'SupportHook',
}: SupportHookProps) {
  const [state, setState] = useState<SupportHookState>({
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

  const contextValue = useMemo<SupportHookContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SupportHookContext.Provider value={contextValue}>
      {children}
      <SupportAvatar />
      <SupportRangeSlider />
      <InventoryBanner1 />
    </SupportHookContext.Provider>
  );
}
