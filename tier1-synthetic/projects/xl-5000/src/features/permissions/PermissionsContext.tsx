import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import PermissionsMeter from './PermissionsMeter';
import PermissionsHeader from './PermissionsHeader';

interface PermissionsContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface PermissionsContextContextValue {
  state: PermissionsContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const PermissionsContextContext = createContext<PermissionsContextContextValue | null>(null);

export function usePermissionsContext() {
  const ctx = useContext(PermissionsContextContext);
  if (!ctx) {
    throw new Error(`usePermissionsContext must be used within a PermissionsContext`);
  }
  return ctx;
}

interface PermissionsContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function PermissionsContext({
  children,
  initialActive = false,
  initialLabel = 'PermissionsContext',
}: PermissionsContextProps) {
  const [state, setState] = useState<PermissionsContextState>({
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

  const contextValue = useMemo<PermissionsContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <PermissionsContextContext.Provider value={contextValue}>
      {children}
      <PermissionsMeter />
      <PermissionsHeader />
    </PermissionsContextContext.Provider>
  );
}
