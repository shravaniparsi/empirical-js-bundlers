import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import RolesSplit1 from './RolesSplit1';
import RolesTabs1 from './RolesTabs1';
import RolesProgress1 from './RolesProgress1';

interface RolesRegistryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface RolesRegistryContextValue {
  state: RolesRegistryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const RolesRegistryContext = createContext<RolesRegistryContextValue | null>(null);

export function useRolesRegistry() {
  const ctx = useContext(RolesRegistryContext);
  if (!ctx) {
    throw new Error(`useRolesRegistry must be used within a RolesRegistry`);
  }
  return ctx;
}

interface RolesRegistryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function RolesRegistry({
  children,
  initialActive = false,
  initialLabel = 'RolesRegistry',
}: RolesRegistryProps) {
  const [state, setState] = useState<RolesRegistryState>({
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

  const contextValue = useMemo<RolesRegistryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <RolesRegistryContext.Provider value={contextValue}>
      {children}
      <RolesSplit1 />
      <RolesTabs1 />
      <RolesProgress1 />
    </RolesRegistryContext.Provider>
  );
}
