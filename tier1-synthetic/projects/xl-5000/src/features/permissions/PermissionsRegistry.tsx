import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import PermissionsAreaChart1 from './PermissionsAreaChart1';
import PermissionsErrorBoundary from './PermissionsErrorBoundary';

interface PermissionsRegistryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface PermissionsRegistryContextValue {
  state: PermissionsRegistryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const PermissionsRegistryContext = createContext<PermissionsRegistryContextValue | null>(null);

export function usePermissionsRegistry() {
  const ctx = useContext(PermissionsRegistryContext);
  if (!ctx) {
    throw new Error(`usePermissionsRegistry must be used within a PermissionsRegistry`);
  }
  return ctx;
}

interface PermissionsRegistryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function PermissionsRegistry({
  children,
  initialActive = false,
  initialLabel = 'PermissionsRegistry',
}: PermissionsRegistryProps) {
  const [state, setState] = useState<PermissionsRegistryState>({
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

  const contextValue = useMemo<PermissionsRegistryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <PermissionsRegistryContext.Provider value={contextValue}>
      {children}
      <PermissionsAreaChart1 />
      <PermissionsErrorBoundary />
    </PermissionsRegistryContext.Provider>
  );
}
