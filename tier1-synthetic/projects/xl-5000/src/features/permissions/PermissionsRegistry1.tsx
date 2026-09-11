import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import PermissionsSticky from './PermissionsSticky';

interface PermissionsRegistry1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface PermissionsRegistry1ContextValue {
  state: PermissionsRegistry1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const PermissionsRegistry1Context = createContext<PermissionsRegistry1ContextValue | null>(null);

export function usePermissionsRegistry1() {
  const ctx = useContext(PermissionsRegistry1Context);
  if (!ctx) {
    throw new Error(`usePermissionsRegistry1 must be used within a PermissionsRegistry1`);
  }
  return ctx;
}

interface PermissionsRegistry1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function PermissionsRegistry1({
  children,
  initialActive = false,
  initialLabel = 'PermissionsRegistry1',
}: PermissionsRegistry1Props) {
  const [state, setState] = useState<PermissionsRegistry1State>({
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

  const contextValue = useMemo<PermissionsRegistry1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <PermissionsRegistry1Context.Provider value={contextValue}>
      {children}
      <PermissionsSticky />
    </PermissionsRegistry1Context.Provider>
  );
}
