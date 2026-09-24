import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AuditSpinner from './AuditSpinner';
import AuditRetry3 from './AuditRetry3';

interface AuditRegistryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AuditRegistryContextValue {
  state: AuditRegistryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AuditRegistryContext = createContext<AuditRegistryContextValue | null>(null);

export function useAuditRegistry() {
  const ctx = useContext(AuditRegistryContext);
  if (!ctx) {
    throw new Error(`useAuditRegistry must be used within a AuditRegistry`);
  }
  return ctx;
}

interface AuditRegistryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AuditRegistry({
  children,
  initialActive = false,
  initialLabel = 'AuditRegistry',
}: AuditRegistryProps) {
  const [state, setState] = useState<AuditRegistryState>({
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

  const contextValue = useMemo<AuditRegistryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AuditRegistryContext.Provider value={contextValue}>
      {children}
      <AuditSpinner />
      <AuditRetry3 />
    </AuditRegistryContext.Provider>
  );
}
