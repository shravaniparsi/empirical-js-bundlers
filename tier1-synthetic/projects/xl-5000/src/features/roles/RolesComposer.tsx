import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import RolesAlert from './RolesAlert';

interface RolesComposerState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface RolesComposerContextValue {
  state: RolesComposerState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const RolesComposerContext = createContext<RolesComposerContextValue | null>(null);

export function useRolesComposer() {
  const ctx = useContext(RolesComposerContext);
  if (!ctx) {
    throw new Error(`useRolesComposer must be used within a RolesComposer`);
  }
  return ctx;
}

interface RolesComposerProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function RolesComposer({
  children,
  initialActive = false,
  initialLabel = 'RolesComposer',
}: RolesComposerProps) {
  const [state, setState] = useState<RolesComposerState>({
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

  const contextValue = useMemo<RolesComposerContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <RolesComposerContext.Provider value={contextValue}>
      {children}
      <RolesAlert />
    </RolesComposerContext.Provider>
  );
}
