import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AuditStepper2 from './AuditStepper2';

interface AuditContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AuditContextContextValue {
  state: AuditContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AuditContextContext = createContext<AuditContextContextValue | null>(null);

export function useAuditContext() {
  const ctx = useContext(AuditContextContext);
  if (!ctx) {
    throw new Error(`useAuditContext must be used within a AuditContext`);
  }
  return ctx;
}

interface AuditContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AuditContext({
  children,
  initialActive = false,
  initialLabel = 'AuditContext',
}: AuditContextProps) {
  const [state, setState] = useState<AuditContextState>({
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

  const contextValue = useMemo<AuditContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AuditContextContext.Provider value={contextValue}>
      {children}
      <AuditStepper2 />
    </AuditContextContext.Provider>
  );
}
