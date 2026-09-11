import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import PermissionsAreaChart from './PermissionsAreaChart';

interface PermissionsFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface PermissionsFactoryContextValue {
  state: PermissionsFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const PermissionsFactoryContext = createContext<PermissionsFactoryContextValue | null>(null);

export function usePermissionsFactory() {
  const ctx = useContext(PermissionsFactoryContext);
  if (!ctx) {
    throw new Error(`usePermissionsFactory must be used within a PermissionsFactory`);
  }
  return ctx;
}

interface PermissionsFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function PermissionsFactory({
  children,
  initialActive = false,
  initialLabel = 'PermissionsFactory',
}: PermissionsFactoryProps) {
  const [state, setState] = useState<PermissionsFactoryState>({
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

  const contextValue = useMemo<PermissionsFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <PermissionsFactoryContext.Provider value={contextValue}>
      {children}
      <PermissionsAreaChart />
    </PermissionsFactoryContext.Provider>
  );
}
