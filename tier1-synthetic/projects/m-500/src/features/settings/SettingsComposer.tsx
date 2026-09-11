import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SettingsPopover from './SettingsPopover';
import SettingsGrid from './SettingsGrid';

interface SettingsComposerState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SettingsComposerContextValue {
  state: SettingsComposerState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SettingsComposerContext = createContext<SettingsComposerContextValue | null>(null);

export function useSettingsComposer() {
  const ctx = useContext(SettingsComposerContext);
  if (!ctx) {
    throw new Error(`useSettingsComposer must be used within a SettingsComposer`);
  }
  return ctx;
}

interface SettingsComposerProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SettingsComposer({
  children,
  initialActive = false,
  initialLabel = 'SettingsComposer',
}: SettingsComposerProps) {
  const [state, setState] = useState<SettingsComposerState>({
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

  const contextValue = useMemo<SettingsComposerContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SettingsComposerContext.Provider value={contextValue}>
      {children}
      <SettingsPopover />
      <SettingsGrid />
    </SettingsComposerContext.Provider>
  );
}
