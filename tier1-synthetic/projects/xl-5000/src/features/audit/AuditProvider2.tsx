import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AuditPreview from './AuditPreview';
import SchedulingRadio from '../scheduling/SchedulingRadio';

interface AuditProvider2State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AuditProvider2ContextValue {
  state: AuditProvider2State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AuditProvider2Context = createContext<AuditProvider2ContextValue | null>(null);

export function useAuditProvider2() {
  const ctx = useContext(AuditProvider2Context);
  if (!ctx) {
    throw new Error(`useAuditProvider2 must be used within a AuditProvider2`);
  }
  return ctx;
}

interface AuditProvider2Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AuditProvider2({
  children,
  initialActive = false,
  initialLabel = 'AuditProvider2',
}: AuditProvider2Props) {
  const [state, setState] = useState<AuditProvider2State>({
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

  const contextValue = useMemo<AuditProvider2ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AuditProvider2Context.Provider value={contextValue}>
      {children}
      <AuditPreview />
      <SchedulingRadio />
    </AuditProvider2Context.Provider>
  );
}
