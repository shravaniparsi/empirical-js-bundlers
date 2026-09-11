import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import PermissionsCheckbox1 from './PermissionsCheckbox1';
import PermissionsDonut from './PermissionsDonut';

interface PermissionsAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface PermissionsAdapterContextValue {
  state: PermissionsAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const PermissionsAdapterContext = createContext<PermissionsAdapterContextValue | null>(null);

export function usePermissionsAdapter() {
  const ctx = useContext(PermissionsAdapterContext);
  if (!ctx) {
    throw new Error(`usePermissionsAdapter must be used within a PermissionsAdapter`);
  }
  return ctx;
}

interface PermissionsAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function PermissionsAdapter({
  children,
  initialActive = false,
  initialLabel = 'PermissionsAdapter',
}: PermissionsAdapterProps) {
  const [state, setState] = useState<PermissionsAdapterState>({
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

  const contextValue = useMemo<PermissionsAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <PermissionsAdapterContext.Provider value={contextValue}>
      {children}
      <PermissionsCheckbox1 />
      <PermissionsDonut />
    </PermissionsAdapterContext.Provider>
  );
}
